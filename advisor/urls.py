from django.urls import path
from core.views import spa_view
from . import views

urlpatterns = [
    path('advisor/', spa_view, name='advisor'),
    path('api/advisor/kb/', views.KnowledgeBaseView.as_view(), name='advisor_kb'),
    path('api/advisor/chat/', views.ChatView.as_view(), name='advisor_chat'),
    path('api/advisor/chat/stream/', views.stream_chat_view, name='advisor_chat_stream'),
    path('api/advisor/decompose/', views.BoMDecomposeView.as_view(), name='advisor_decompose'),
]
