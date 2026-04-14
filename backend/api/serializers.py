# backend/api/serializers.py

from rest_framework import serializers
from .models import File, Profile
from django.contrib.auth.models import User
from .models import Folder


class FolderSerializer(serializers.ModelSerializer):
    """
    A serializer for the Folder model.
    """
    #amu
    class Meta:
        model = Folder
        fields = ['id', 'name', 'parent', 'created_at', 'is_favorite','is_vault']

class FileSerializer(serializers.ModelSerializer):
    """
    A serializer to convert File model instances into JSON format.
    """
    folder_name = serializers.CharField(source='folder.name', read_only=True, default=None)

    class Meta:
        model = File
        fields = ['id', 'filename', 'file', 'owner', 'upload_date', 'file_hash', 'folder', 'size', 'is_favorite','folder_name', 'iv','summary','is_shared']
        read_only_fields = ['id', 'upload_date', 'size', 'file_hash', 'owner','iv', 'summary', 'is_shared']

class UserSerializer(serializers.ModelSerializer):   
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        """
        Create and return a new user with a hashed password.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user
# class ProfileSerializer(serializers.ModelSerializer):
    # class Meta:
        # model = User
        # fields = ['username', 'first_name', 'last_name', 'email']
        # read_only_fields = ['username'] # User cannot change their username

class ProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Profile
        fields = ['username', 'first_name', 'last_name', 'email', 'profile_picture']

    def update(self, instance, validated_data):
        # Handle updating the nested User model fields
        user_data = validated_data.pop('user', {})
        user = instance.user
        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.email = user_data.get('email', user.email)
        user.save()

        # Handle updating the Profile model fields
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.save()
        return instance