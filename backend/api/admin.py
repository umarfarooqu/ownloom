# backend/api/admin.py

from django.contrib import admin
from .models import File, Folder  # Import your File and Folder models

# Register your models here.
admin.site.register(File) # Add this line
admin.site.register(Folder)