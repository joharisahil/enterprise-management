import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { AlertsPage } from './pages/AlertsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/properties"
            element={
              <PrivateRoute>
                <Layout>
                  <PropertiesPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/property-taxes"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Property Taxes" description="Manage property tax records with frequency validation" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/electricity"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Electricity & Solar" description="Track grid electricity and solar net metering" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/gas"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Gas Bills" description="Manage gas consumption and bills" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/water"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Water Bills" description="Track water consumption and sewage charges" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <PrivateRoute>
                <Layout>
                  <VehiclesPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Vehicle Documents" description="Versioned document management with expiry tracking" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/challans"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Challans" description="Track vehicle violations and fines" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/service"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Service & Maintenance" description="Vehicle service records and reminders" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/gps"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="GPS & Trips" description="Provider-agnostic telematics with simulation mode" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Drivers" description="Driver management with risk scoring" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/accidents"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Accidents & Claims" description="Track accidents and insurance claims" />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <PrivateRoute>
                <Layout>
                  <AlertsPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <Layout>
                  <PlaceholderPage title="Analytics & Reports" description="Advanced analytics and reporting" />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
