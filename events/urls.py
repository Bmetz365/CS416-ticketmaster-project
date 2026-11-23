from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('itinerary/', views.itinerary_view, name='itinerary'),

    # Auth routes (Extra Credit Opportunity 1)
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # AJAX CRUD endpoints (Requirement 5)
    path('api/events/add/', views.add_saved_event, name='add_saved_event'),
    path('api/events/update/<int:pk>/', views.update_saved_event, name='update_saved_event'),
    path('api/events/delete/<int:pk>/', views.delete_saved_event, name='delete_saved_event'),
]