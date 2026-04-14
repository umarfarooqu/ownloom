from django.contrib.auth.models import User
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from django.http import FileResponse
from django.utils import timezone
from django.db.models import Q
from .models import File, Folder, Profile
from .serializers import (
    FileSerializer,
    FolderSerializer,
    ProfileSerializer,
    UserSerializer,
)            
from django.core.files.base import ContentFile
from django.contrib.auth.hashers import make_password, check_password
from django.conf import settings
from django.http import HttpResponse
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from transformers import pipeline 
import io 
import pytesseract
import uuid
import hashlib
import os
import threading 
import pdfplumber
import docx

# ---------- Folder Views ----------

def extract_text_from_file(file_instance):
    """
    Extracts text from various file types (.txt, .docx, text-based .pdf).
    OCR (Image-based files) ko simplify karne ke liye hata diya gaya hai.
    """
    try:
        file_path = file_instance.file.path
        filename = file_instance.filename.lower()
        extracted_text = ""

        print(f"--- Extracting text from: {filename} ---")

        if filename.endswith('.txt'):
            # .txt files ko padhein
            with file_instance.file.open('r', encoding='utf-8') as f:
                extracted_text = f.read()
        
        elif filename.endswith('.docx'):
            # .docx files ko padhein
            try:
                doc = docx.Document(file_path)
                fullText = []
                for para in doc.paragraphs:
                    fullText.append(para.text)
                extracted_text = '\n'.join(fullText)
            except Exception as e:
                print(f"Error reading docx {filename}: {e}")

        elif filename.endswith('.pdf'):
            # Sirf text-based .pdf files ko padhein
            try:
                with pdfplumber.open(file_path) as pdf:
                    all_text = []
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            all_text.append(page_text)
                    extracted_text = "\n".join(all_text)
                
                if not extracted_text.strip():
                     print(f"PDF {filename} has no extractable text (it might be image-based).")
            
            except Exception as e:
                print(f"Error processing PDF {filename}: {e}")
        
        else:
            print(f"Unsupported file type for text extraction: {filename}")

        if extracted_text.strip():
            print(f"Successfully extracted text from: {file_instance.filename}")
            return extracted_text.strip()
        else:
            print(f"No text extracted from: {file_instance.filename}")
            return None

    except Exception as e:
        print(f"Error during text extraction for file {file_instance.id}: {e}")
        return None
    
try:
    summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
except Exception as e:
    print(f"CRITICAL: Failed to load summarization model. {e}")
    summarizer = None

def generate_summary_and_save(file_instance):
    """
    Background task: Extracts text, generates summary, and saves to DB.
    """
    # Hum debugging wale print statements hata sakte hain
    print(f"--- Task Started: {file_instance.filename} ---")
    
    # Kadam 1: Text extract karein
    extracted_text = extract_text_from_file(file_instance)
    
    if not extracted_text:
        print(f"Task Ended: No text found in {file_instance.filename}.\n")
        return

    file_instance.extracted_text = extracted_text
    
    if summarizer:
        try:
            summary_result = summarizer(
                extracted_text,  
                max_length=150, 
                min_length=30, 
                do_sample=False,
                truncation=True  
            )
            
            if summary_result:
                file_instance.summary = summary_result[0]['summary_text']
                print(f"Summary generated successfully for: {file_instance.filename}")
            else:
                 print(f"Summarizer returned no result.")
                
        except Exception as e:
            print(f"CRITICAL ERROR during summarization: {e}")
            
    else:
        print("SUMMARIZER MODEL IS NONE.")
            
    try:
        file_instance.save(update_fields=['extracted_text', 'summary'])
        print(f"--- Task Complete: Saved to DB for {file_instance.filename} ---\n")
    except Exception as e:
        print(f"Error: Failed to save to database: {e}\n")

def get_encryption_key():
    """
    Gets the encryption key from settings.
    We use SECRET_KEY for simplicity, but a dedicated ENCRYPTION_KEY is better.
    """
    # We use the first 32 bytes (256 bits) of the SECRET_KEY.
    key = settings.SECRET_KEY.encode('utf-8')[:32]
    if len(key) < 32:
        key = key.ljust(32, b'0') # Pad key if it's shorter than 32 bytes
    return key

def encrypt_file(file_data, key):
    """
    Encrypts file data using AES-GCM and returns encrypted data + IV.
    """
    aesgcm = AESGCM(key)
    iv = os.urandom(12) # 12-byte (96-bit) IV is recommended for GCM
    encrypted_data = aesgcm.encrypt(iv, file_data, None)
    return encrypted_data, iv.hex() # Return IV as a hex string

def decrypt_file(encrypted_data, key, iv_hex):
    """
    Decrypts file data using AES-GCM.
    """
    aesgcm = AESGCM(key)
    iv = bytes.fromhex(iv_hex) # Convert hex string back to bytes
    decrypted_data = aesgcm.decrypt(iv, encrypted_data, None)
    return decrypted_data

class FolderListCreateView(generics.ListCreateAPIView):
    """
    List all folders for a user or create a new folder.
    """
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Folder.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        parent_id = self.request.data.get('parent', None)
        parent_folder = None
        if parent_id:
            parent_folder = get_object_or_404(Folder, id=parent_id, owner=self.request.user)
        
        # Remove 'parent' from validated_data to prevent TypeError
        validated_data = serializer.validated_data
        if 'parent' in validated_data:
            validated_data.pop('parent')

        serializer.save(owner=self.request.user, parent=parent_folder)
        
class FolderSetPasswordView(APIView):
    """
    Sets a password on a folder, turning it into an encrypted vault.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        folder = get_object_or_404(Folder, pk=pk, owner=request.user)
        password = request.data.get("password")

        if not password:
            return Response(
                {"detail": "Password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if folder.files.exists() or folder.subfolders.exists():
            return Response(
                {"detail": "Cannot turn a non-empty folder into a vault."},
                status=status.HTTP_400_BAD_REQUEST
            )

        folder.vault_password = make_password(password)
        folder.is_vault = True
        folder.save()

        return Response(
            {"detail": "Folder is now an encrypted vault."},
            status=status.HTTP_200_OK
        )

class FolderUnlockView(APIView):
    """
    Checks if the provided password for a vault is correct.
    Does not decrypt or return any files.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        folder = get_object_or_404(Folder, pk=pk, owner=request.user)
        password = request.data.get("password")

        if not folder.is_vault:
            return Response(
                {"detail": "This is not a vault."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not password:
            return Response(
                {"detail": "Password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if check_password(password, folder.vault_password):
            # Password is correct
            return Response({"success": True}, status=status.HTTP_200_OK)
        else:
            # Password is wrong
            return Response(
                {"detail": "Invalid vault password."},
                status=status.HTTP_403_FORBIDDEN
            )

class FolderRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a folder.
    """
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Folder.objects.filter(owner=self.request.user)


# ---------- File Views ----------

class FileListCreateView(generics.ListCreateAPIView):
    """
    List all files for a user or upload a new file.
    Supports folder-aware uploads.
    """
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # 1. File check karein
        file_obj = request.FILES.get('file')
        if not file_obj:
             return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Folder ID sahi karein
        folder_id = request.data.get('folder')
        if folder_id == 'null' or folder_id == '':
            folder_id = None
            
        # 3. Duplicate Filename Check
        # Agar user ki same folder mein same naam ki file hai, toh error bhejein
        if File.objects.filter(
            owner=request.user,
            folder_id=folder_id,
            filename=file_obj.name,
            in_trash=False
        ).exists():
            return Response(
                {"detail": "File with this name already exists."},
                status=status.HTTP_409_CONFLICT
            )
            
        # 4. Agar sab sahi hai, toh aage badhein (Encryption wagarah ke liye)
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        return File.objects.filter(owner=self.request.user, in_trash=False)

    def perform_create(self, serializer):
        file_obj = self.request.data.get("file")
        filename = file_obj.name
        file_size = file_obj.size

        profile = self.request.user.profile
        if profile.storage_used + file_size > profile.storage_limit:
            raise serializers.ValidationError("Storage limit exceeded!")

        file_obj.seek(0)
        file_hash = hashlib.sha256(file_obj.read()).hexdigest()
        file_obj.seek(0)

        if File.objects.filter(file_hash=file_hash, owner=self.request.user).exists():
            return Response(
                {"detail": "This file already exists!"},
                status=status.HTTP_409_CONFLICT
            )

        folder_id = self.request.data.get("folder", None)
        folder = None
        if folder_id:
            folder = Folder.objects.get(id=folder_id, owner=self.request.user)

        iv_to_save = None
        file_to_upload = file_obj

        if folder and folder.is_vault:
            print(f"Encrypting file for vault: {folder.name}")
            key = get_encryption_key()
            file_obj.seek(0)
            file_data = file_obj.read()
            file_obj.seek(0)

            encrypted_data, iv_hex = encrypt_file(file_data, key)

            file_to_upload = ContentFile(encrypted_data, name=filename)
            iv_to_save = iv_hex

        profile.storage_used += file_size
        profile.save()

        instance = serializer.save(
            owner=self.request.user,
            filename=filename,
            file_hash=file_hash,
            folder=folder,
            size=file_obj.size,
            file=file_to_upload,  
            iv=iv_to_save         
        )
        print(f"Queueing background task for file: {instance.filename}")
        threading.Thread(target=generate_summary_and_save, args=(instance,)).start()

class FileRetrieveDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve or delete a file.
    """
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(owner=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        # 1. File object haasil karein
        instance = self.get_object() 
        
        # 2. Check karein ki summary ki zaroorat hai ya nahi
        filename = instance.filename.lower()
        is_summ_file = filename.endswith(('.txt', '.docx', '.pdf'))
        is_empty_summ = not instance.summary
        
        # 3. Agar yeh summarizable file hai aur summary khaali hai
        if is_summ_file and is_empty_summ:
            print(f"--- On-Demand Summary Task Started (Blocking): {instance.filename} ---")
            try:
                generate_summary_and_save(instance)
                instance.refresh_from_db()
                print(f"--- On-Demand Task Complete: {instance.filename} ---")
                
            except Exception as e:
                print(f"--- On-Demand Task FAILED: {e} ---")
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_destroy(self, instance):
        profile = self.request.user.profile
        profile.storage_used -= instance.size
        profile.save()
        instance.delete()


# ---------- Browse & Search ----------

class BrowseView(APIView):
    """
    Browse folders and files (Google Drive style).
    If folder_id is None → show root folders and files.
    If folder_id is given → show subfolders and files inside that folder.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, folder_id=None):
        if folder_id:
            folder = get_object_or_404(Folder, id=folder_id, owner=request.user)
            #amu
            subfolders = Folder.objects.filter(owner=request.user, parent=folder, in_trash=False)
            files = File.objects.filter(owner=request.user, folder=folder, in_trash=False)
        else:
            subfolders = Folder.objects.filter(owner=request.user, parent=None, in_trash=False)
            files = File.objects.filter(owner=request.user, folder=None, in_trash=False)

        return Response({
            "folders": FolderSerializer(subfolders, many=True).data,
            "files": FileSerializer(files, many=True).data,
        })
        

class SearchView(APIView):
    """
    Search for files and folders by name.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "")
        file_type = request.query_params.get("type", None)
        
        filename_query = Q(filename__icontains=query)
        text_content_query = Q(extracted_text__icontains=query)
        
        searched_files = File.objects.filter(
            Q(owner=self.request.user) & 
            Q(in_trash=False) &
            (filename_query | text_content_query) 
        )
        
        if file_type:
            if file_type == 'pdf':
                searched_files = searched_files.filter(filename__iendswith='.pdf')
            
            elif file_type == 'image':
                image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
                image_query = Q()
                for ext in image_extensions:
                    image_query |= Q(filename__iendswith=ext)
                searched_files = searched_files.filter(image_query)

            elif file_type == 'document':
                doc_extensions = ['.doc', '.docx', '.txt']
                doc_query = Q()
                for ext in doc_extensions:
                    doc_query |= Q(filename__iendswith=ext)
                searched_files = searched_files.filter(doc_query)
        
        
        print(f"--- Search initiated for query: '{query}' ---")
        
        if not query:
            return Response({"folders": [], "files": []})

        searched_folders = Folder.objects.filter(
            owner=request.user, 
            name__icontains=query, 
            in_trash=False
        )
        
        if file_type:
            searched_folders = Folder.objects.none()

        print(f"Found {searched_folders.count()} folders.")
        print(f"Found {searched_files.count()} files.")
        print("-----------------------------------------")

        return Response({
            "folders": FolderSerializer(searched_folders, many=True).data,
            "files": FileSerializer(searched_files, many=True).data,
        })

class FileServeView(APIView):
    """
    Serves the actual file content for viewing or downloading.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, file_id):
        file_instance = get_object_or_404(File, id=file_id, owner=request.user)
        if file_instance.folder and file_instance.folder.is_vault:
            # This file is in a vault, it needs decryption

            # 1. Get password from query: /open/?vault_pass=...
            password = request.query_params.get("vault_pass", None)
            if not password:
                return Response(
                    {"detail": "Vault password required."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # 2. Check password
            if not check_password(password, file_instance.folder.vault_password):
                return Response(
                    {"detail": "Invalid vault password."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # 3. Decrypt file
            try:
                key = get_encryption_key()
                file_instance.file.open('rb')
                encrypted_data = file_instance.file.read()
                file_instance.file.close()

                decrypted_data = decrypt_file(encrypted_data, key, file_instance.iv)

                # Serve the decrypted data from memory
                response = HttpResponse(
                    decrypted_data,
                    content_type='application/octet-stream' # Generic type
                )
                # Set filename for download
                response['Content-Disposition'] = f'inline; filename="{file_instance.filename}"'
                return response

            except Exception as e:
                print(f"Decryption error: {e}")
                return Response(
                    {"detail": "File decryption failed. File might be corrupt."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        response = FileResponse(
            file_instance.file.open('rb'),
            as_attachment=False,
            filename=file_instance.filename
        )
        return response

# ---------- Profile Views ----------

class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the user profile.
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile


# ---------- Storage Usage ----------

class StorageUsageView(APIView):
    """
    Return total storage used AND breakdown by file type.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        files = File.objects.filter(owner=request.user, in_trash=False)
        
        # Categories initialize karein
        breakdown = {
            'images': 0,
            'documents': 0,
            'media': 0, 
            'others': 0
        }
        
        total_size = 0
        
        # Extensions define karein
        image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
        doc_exts = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx']
        media_exts = ['.mp3', '.wav', '.mp4', '.webm', '.mkv', '.mov']

        for f in files:
            try:
                size = f.size
                total_size += size
                
                ext = f.filename.lower()
                # Extension check karke sahi category mein add karein
                if any(ext.endswith(e) for e in image_exts):
                    breakdown['images'] += size
                elif any(ext.endswith(e) for e in doc_exts):
                    breakdown['documents'] += size
                elif any(ext.endswith(e) for e in media_exts):
                    breakdown['media'] += size
                else:
                    breakdown['others'] += size
                    
            except Exception:
                continue

        def to_mb(bytes_val):
            return round(bytes_val / (1024 * 1024), 2)

        return Response({
            "storage_used_mb": to_mb(total_size),
            "limit_mb": 1024, # 1 GB Limit (Demo)
            "breakdown": {
                "Images": to_mb(breakdown['images']),
                "Documents": to_mb(breakdown['documents']),
                "Media": to_mb(breakdown['media']),
                "Others": to_mb(breakdown['others'])
            }
        })
        
# ---------- User Signup ----------

class UserCreateView(generics.CreateAPIView):
    """
    Create a new user account.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
class TrashContentView(APIView):
    """
    Trash mein padi saari files aur folders ko list karta hai.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        trashed_folders = Folder.objects.filter(owner=request.user, in_trash=True)
        trashed_files = File.objects.filter(owner=request.user, in_trash=True)
        return Response({
            "folders": FolderSerializer(trashed_folders, many=True).data,
            "files": FileSerializer(trashed_files, many=True).data,
        })

class FileMoveToTrashView(APIView):
    """
    Ek file ko trash mein bhejta hai (soft delete).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        file_instance = get_object_or_404(File, pk=pk, owner=request.user)
        file_instance.in_trash = True
        file_instance.deleted_at = timezone.now()
        file_instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class SpamContentView(APIView):
    """
    Spam mein padi saari files ko list karta hai.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        spammed_files = File.objects.filter(owner=request.user, is_spam=True, in_trash=False)
        return Response({
            "folders": [], 
            "files": FileSerializer(spammed_files, many=True).data,
        })

class FileMoveToSpamView(APIView):
    """
    Ek file ko spam mark/unmark karta hai (toggle).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        file_instance = get_object_or_404(File, pk=pk, owner=request.user)
        
        file_instance.is_spam = not file_instance.is_spam 
        
        if file_instance.is_spam:
            file_instance.in_trash = False
            file_instance.deleted_at = None
            
        file_instance.save()
        return Response(status=status.HTTP_200_OK)

class FileRestoreView(APIView):
    """
    Ek file ko trash se wapas lata hai.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        file_instance = get_object_or_404(File, pk=pk, owner=request.user)
        file_instance.in_trash = False
        file_instance.deleted_at = None
        file_instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class FavoriteContentView(APIView):
    """
    User ki saari favorited files aur folders ko list karta hai.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favorited_folders = Folder.objects.filter(owner=request.user, is_favorite=True, in_trash=False)
        favorited_files = File.objects.filter(owner=request.user, is_favorite=True, in_trash=False)
        return Response({
            "folders": FolderSerializer(favorited_folders, many=True).data,
            "files": FileSerializer(favorited_files, many=True).data,
        })

class ToggleFavoriteView(APIView):
    """
    Kisi file ya folder ko favorite/unfavorite karta hai.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, item_type, pk):
        if item_type == 'file':
            instance = get_object_or_404(File, pk=pk, owner=request.user)
        elif item_type == 'folder':
            instance = get_object_or_404(Folder, pk=pk, owner=request.user)
        else:
            return Response({"detail": "Invalid item type."}, status=status.HTTP_400_BAD_REQUEST)

        instance.is_favorite = not instance.is_favorite # Toggle the favorite status
        instance.save()
        return Response(status=status.HTTP_200_OK)

class ShareFileView(APIView):
    """
    Generates or retrieves a shareable link for a file.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        file_instance = get_object_or_404(File, pk=pk, owner=request.user)
        
        password = request.data.get("password", None)
        
        if not file_instance.share_token:
            file_instance.share_token = uuid.uuid4()
        
        file_instance.is_shared = True
        if password:
            file_instance.share_password = make_password(password)
        else:
            file_instance.share_password = None
            
        file_instance.save()

        share_url = request.build_absolute_uri(f'/shared/{file_instance.share_token}/')
        
        return Response({'share_url': share_url, 'password_protected': bool(password)}, status=status.HTTP_200_OK)
    
class SharedFilesView(generics.ListAPIView):
    """
    List all files that have been shared by the user.
    """
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user, 
            is_shared=True, 
            in_trash=False
        )

# --- 2. UNSHARE (LINK BAND) KARNE KE LIYE ---
class UnshareFileView(APIView):
    """
    Revoke a shared link for a file.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        file_instance = get_object_or_404(File, pk=pk, owner=request.user)
        
        # Sharing band karein
        file_instance.is_shared = False
        file_instance.share_token = None
        file_instance.share_password = None
        file_instance.save()
        
        return Response({"detail": "File unshared successfully."}, status=status.HTTP_200_OK)

class PublicFileView(APIView):
    """
    A public view to access a shared file using its token.
    No authentication required.
    """
    permission_classes = [permissions.AllowAny] 
    def get_file_instance(self, token):
        return get_object_or_404(
            File, 
            share_token=token, 
            is_shared=True, 
            in_trash=False
        )
    def get(self, request, token):
        file_instance = self.get_file_instance(token)
        return Response({
            "filename": file_instance.filename,
            "size": file_instance.size,
            "password_required": bool(file_instance.share_password)
        }, status=status.HTTP_200_OK)
        
    def post(self, request, token):
       
        file_instance = self.get_file_instance(token)
        password = request.data.get("password", None)

        if file_instance.share_password:
            if not password:
                return Response(
                    {"detail": "Password required."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not check_password(password, file_instance.share_password):
                return Response(
                    {"detail": "Invalid password."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        response = FileResponse(
            file_instance.file.open('rb'), 
            as_attachment=True, 
            filename=file_instance.filename
        )
        return response
    
class RecentFilesView(generics.ListAPIView):
    """
    Lists the 15 most recently modified files for the user.
    """
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user, 
            in_trash=False
        ).order_by('-last_modified')[:15]