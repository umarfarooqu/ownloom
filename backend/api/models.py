# backend/api/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class Folder(models.Model):
    """
    Represents a folder that can contain other folders or files.
    """
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    created_at = models.DateTimeField(auto_now_add=True)
    in_trash = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_favorite = models.BooleanField(default=False)
    is_vault = models.BooleanField(default=False)
    vault_password = models.CharField(max_length=128, null=True, blank=True)
    
    def __str__(self):
        return f"Folder '{self.name}'"

class File(models.Model):
    """
    Represents a file uploaded by a user.
    """
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    file = models.FileField(upload_to='user_files/')
    filename = models.CharField(max_length=255)
    upload_date = models.DateTimeField(auto_now_add=True)
    file_hash = models.CharField(max_length=64, unique=True, blank=True, null=True)
    size = models.BigIntegerField(default=0)  # Size in bytes
    in_trash = models.BooleanField(default=False)
    is_spam = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_favorite = models.BooleanField(default=False)
    is_shared = models.BooleanField(default=False)
    share_token = models.UUIDField(null=True, blank=True, unique=True)
    share_password = models.CharField(max_length=128, null=True, blank=True)
    last_modified = models.DateTimeField(auto_now=True)
    extracted_text = models.TextField(null=True, blank=True)
    iv = models.CharField(max_length=32, null=True, blank=True)
    summary = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.filename} uploaded by {self.owner.username}"



class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    # New fields for storage management
    storage_limit = models.BigIntegerField(default=1073741824) # 1GB in bytes
    storage_used = models.BigIntegerField(default=0) # Total bytes used

    def __str__(self):
        return f'{self.user.username} Profile'
    
class FileVersion(models.Model):
    """
    Stores a previous version of a file.
    """
    # Yeh batata hai ki yeh kis "current" file ka purana version hai
    original_file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='versions')
    
    # Yeh purani file ko store karta hai
    file = models.FileField(upload_to='file_versions/')
    
    filename = models.CharField(max_length=255)
    size = models.BigIntegerField(default=0)
    file_hash = models.CharField(max_length=64, blank=True, null=True)
    
    archived_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-archived_at']

    def __str__(self):
        return f"Version of {self.filename} (Archived: {self.archived_at.strftime('%Y-%m-%d %H:%M')})"

