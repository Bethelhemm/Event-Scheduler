from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from users.serializers import RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist


import logging
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    from rest_framework.exceptions import ValidationError

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            data = {
                "user": RegisterSerializer(user).data,
                "token": str(refresh.access_token),
                "refresh": str(refresh),
            }
            return Response(data, status=status.HTTP_201_CREATED)
        except ValidationError as ve:
            logger.error(f"Registration validation error: {ve.detail}", exc_info=True)
            return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            return Response({"error": "Registration failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        try:
            logger.debug(f"Token refresh request data: {attrs}")
            return super().validate(attrs)
        except ObjectDoesNotExist:
            raise ValidationError("User does not exist or has been deleted.")

class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        logger.info(f"TokenRefreshView request headers: {request.headers}")
        logger.info(f"TokenRefreshView request data: {request.data}")
        return super().post(request, *args, **kwargs)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]  # Keep as-is unless you want to allow unauthenticated logout

    def post(self, request):
        try:
            logger.debug(f"Logout request data: {request.data}")
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                logger.warning(f"Token blacklisting failed: {str(e)}")

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Logout error: {str(e)}", exc_info=True)
            return Response({"error": "Logout failed"}, status=status.HTTP_400_BAD_REQUEST)