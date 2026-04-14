# backend/api/urls.py

from django.urls import path, re_path
from . import views
from .views import (
    UserCreateView,
    FileListCreateView,
    FileRetrieveDestroyView,
    StorageUsageView,
    ProfileView,
    FolderListCreateView,
    FolderRetrieveUpdateDestroyView,
    BrowseView,
    SearchView,
    ShareFileView,
    PublicFileView,
    RecentFilesView,
    FolderSetPasswordView,
    FolderUnlockView,
)
from .views import FileServeView, TrashContentView, FileMoveToTrashView, FileRestoreView,FavoriteContentView,ToggleFavoriteView, SpamContentView, FileMoveToSpamView

urlpatterns = [
    # -------- User & Profile --------
    path("register/", UserCreateView.as_view(), name="user-create"),
    path("profile/", ProfileView.as_view(), name="profile"),

    # -------- Files --------
    path("files/", FileListCreateView.as_view(), name="file-list-create"),  
    path("files/<int:pk>/", FileRetrieveDestroyView.as_view(), name="file-detail"),  

    # -------- Folders --------
    path("folders/", FolderListCreateView.as_view(), name="folder-list-create"),  
    path("folders/<int:pk>/", FolderRetrieveUpdateDestroyView.as_view(), name="folder-detail"), 
    path("folders/<int:pk>/set-password/", FolderSetPasswordView.as_view(), name="folder-set-password"),
    path("folders/<int:pk>/unlock/", FolderUnlockView.as_view(), name="folder-unlock"),

    # -------- Browse & Search --------
    path("browse/", BrowseView.as_view(), name="browse-root"),
    path("browse/<int:folder_id>/", BrowseView.as_view(), name="browse-folder"),  
    path("search/", SearchView.as_view(), name="file-search"),

    # -------- Storage Usage --------
    path("storage/", StorageUsageView.as_view(), name="storage-usage"),
    path('files/<int:file_id>/open/', FileServeView.as_view(), name='file-open'),
    # Trash URLs
    path('trash/', TrashContentView.as_view(), name='trash-content'),
    path('files/<int:pk>/trash/', FileMoveToTrashView.as_view(), name='file-move-to-trash'),
    path('files/<int:pk>/restore/', FileRestoreView.as_view(), name='file-restore'),
    # Favorites URLs
    path('favorites/', FavoriteContentView.as_view(), name='favorite-content'),
    path('<str:item_type>s/<int:pk>/favorite/', ToggleFavoriteView.as_view(), name='toggle-favorite'),

    path('files/<int:pk>/share/', ShareFileView.as_view(), name='share-file'),
    path('recent/', RecentFilesView.as_view(), name='recent-files'),
    re_path(r'^shared/(?P<token>[0-9a-fA-F-]+)/$', PublicFileView.as_view(), name='public-file-view'),
    
    path('spam/', SpamContentView.as_view(), name='spam-content'),
    path('files/<int:pk>/spam/', FileMoveToSpamView.as_view(), name='file-spam'),
    path('shared-files/', views.SharedFilesView.as_view(), name='shared-files'),
    path('files/<int:pk>/unshare/', views.UnshareFileView.as_view(), name='unshare-file'),
]
