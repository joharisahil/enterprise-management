import pytest
import requests
import uuid

class TestAuth:
    """Test authentication endpoints"""

    def test_login_success(self, api_client, base_url):
        """Test successful login"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "email": "admin@erp.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "admin@erp.com"
        assert data["user"]["role"] == "SuperAdmin"

    def test_login_invalid_credentials(self, api_client, base_url):
        """Test login with invalid credentials"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "email": "admin@erp.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"

    def test_login_nonexistent_user(self, api_client, base_url):
        """Test login with non-existent user"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        assert response.status_code == 401

    def test_get_me(self, authenticated_client, base_url):
        """Test getting current user profile"""
        response = authenticated_client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@erp.com"
        assert data["full_name"] == "Admin User"
        assert data["role"] == "SuperAdmin"

    def test_get_me_unauthorized(self, api_client, base_url):
        """Test accessing profile without auth"""
        response = api_client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 401
