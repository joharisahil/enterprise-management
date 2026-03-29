import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Truck,
  FileText,
  Shield,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Wrench,
  Zap,
  Download,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  MapPin,
  User,
  Gauge,
  Fuel,
  Plus,
  Edit,
  X,
  CreditCard,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

// Helper functions
const getDaysLeft = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

const getStatusBadge = (daysLeft) => {
  if (daysLeft === null) return <Badge variant="outline">N/A</Badge>;
  if (daysLeft <= 0) return <Badge className="bg-rose-100 text-rose-700">Expired</Badge>;
  if (daysLeft <= 7) return <Badge className="bg-orange-100 text-orange-700">Critical ({daysLeft}d)</Badge>;
  if (daysLeft <= 15) return <Badge className="bg-amber-100 text-amber-700">Warning ({daysLeft}d)</Badge>;
  if (daysLeft <= 30) return <Badge className="bg-yellow-100 text-yellow-700">Soon ({daysLeft}d)</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700">Valid ({daysLeft}d)</Badge>;
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "Rs. 0";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "Rs. 0";
  const formattedNumber = numAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs. ${formattedNumber}`;
};

export const VehicleDetailSheet = ({
  vehicle,
  open,
  onOpenChange,
  vehicleReport,
  fastagPasses,
  onAddPass,
  onEditPass,
  onDeletePass,
  onRefresh,
  onFetchChallans,
  fetchingChallans,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [localVehicleData, setLocalVehicleData] = useState(null);
  const [localVehicleReport, setLocalVehicleReport] = useState(null);
  const [localFastagPasses, setLocalFastagPasses] = useState([]);
  const [showRcDeleteDialog, setShowRcDeleteDialog] = useState(false);
  const [showDocumentDeleteDialog, setShowDocumentDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [uploadingRc, setUploadingRc] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState({});
  const [downloadingRc, setDownloadingRc] = useState(false);
  const [downloadingDocument, setDownloadingDocument] = useState({});
  const [rcFileInputRef, setRcFileInputRef] = useState(null);
  const [documentFileInputRefs, setDocumentFileInputRefs] = useState({});

  const [fetchingFastagBalance, setFetchingFastagBalance] = useState(false);
  const [fetchingFastagTransactions, setFetchingFastagTransactions] = useState(false);
  const [fastagBalanceData, setFastagBalanceData] = useState(null);
  const [fastagTransactions, setFastagTransactions] = useState([]);

  useEffect(() => {
    if (vehicle) setLocalVehicleData(vehicle);
  }, [vehicle]);

  useEffect(() => {
    if (vehicleReport) setLocalVehicleReport(vehicleReport);
  }, [vehicleReport]);

  useEffect(() => {
    if (fastagPasses) setLocalFastagPasses(fastagPasses);
  }, [fastagPasses]);

  useEffect(() => {
    if (vehicle && open) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vehicle, open]);

  // Complete PDF Generation
  const generatePDF = async () => {
    if (!localVehicleData) return;

    setGeneratingPDF(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const primaryColor = [16, 185, 129];
      const secondaryColor = [100, 116, 139];

      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Vehicle Full Report", 14, 20);

      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(localVehicleData.registration_number, 14, 30);

      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 38, 196, 38);

      let yPos = 45;

      // Vehicle Details
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Vehicle Details", 14, yPos);
      yPos += 6;

      const vehicleDetails = [
        ["Registration Number", localVehicleData.registration_number],
        ["Owner Name", localVehicleData.owner_name || "N/A"],
        ["Brand/Model", `${localVehicleData.brand} ${localVehicleData.model}`],
        ["Year", localVehicleData.year || "N/A"],
        ["Type", localVehicleData.type],
        ["Fuel Type", localVehicleData.fuel_type],
        ["Color", localVehicleData.color || "N/A"],
        ["Chassis Number", localVehicleData.chassis_number || "N/A"],
        ["Engine Number", localVehicleData.engine_number || "N/A"],
        ["Seating Capacity", localVehicleData.seating_capacity || "N/A"],
        ["Average Mileage", localVehicleData.average_kmpl ? `${localVehicleData.average_kmpl} km/l` : "N/A"],
        ["Tank Capacity", localVehicleData.tank_capacity_liters ? `${localVehicleData.tank_capacity_liters} L` : "N/A"],
        ["Site Name", localVehicleData.site_name || "N/A"],
        ["Source", localVehicleData.source || "Manual"],
        ["File Status", localVehicleData.file_status ? "Complete" : "Incomplete"],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Field", "Value"]],
        body: vehicleDetails,
        theme: "striped",
        headStyles: { fillColor: primaryColor },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // Insurance & Tax Details
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Insurance & Tax Details", 14, yPos);
      yPos += 6;

      const insuranceDetails = [
        ["Insurance Expiry", localVehicleData.insurance_expiry ? new Date(localVehicleData.insurance_expiry).toLocaleDateString() : "N/A"],
        ["Insurance Company", localVehicleData.insurance_company || "N/A"],
        ["Insurance Policy", localVehicleData.insurance_policy_number || "N/A"],
        ["PUC Expiry", localVehicleData.puc_expiry ? new Date(localVehicleData.puc_expiry).toLocaleDateString() : "N/A"],
        ["PUCC Number", localVehicleData.pucc_number || "N/A"],
        ["Tax Validity", localVehicleData.tax_upto === 'LIFETIME' ? 'Lifetime' : (localVehicleData.tax_upto ? new Date(localVehicleData.tax_upto).toLocaleDateString() : "N/A")],
        ["Fitness Upto", localVehicleData.fit_up_to ? new Date(localVehicleData.fit_up_to).toLocaleDateString() : "N/A"],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Field", "Value"]],
        body: insuranceDetails,
        theme: "striped",
        headStyles: { fillColor: primaryColor },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // Documents Section
      if (localVehicleReport?.documents && localVehicleReport.documents.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Documents", 14, yPos);
        yPos += 6;

        const documentsData = localVehicleReport.documents.map((docItem) => {
          const daysLeft = getDaysLeft(docItem.expiry_date);
          const status = daysLeft === null ? "N/A" : daysLeft <= 0 ? "Expired" : daysLeft < 30 ? "Expiring Soon" : "Active";
          return [
            docItem.document_type === "Custom" ? docItem.custom_document_name || "Custom" : docItem.document_type,
            docItem.provider || "N/A",
            docItem.policy_number || "N/A",
            docItem.issue_date ? new Date(docItem.issue_date).toLocaleDateString() : "N/A",
            docItem.expiry_date ? new Date(docItem.expiry_date).toLocaleDateString() : "N/A",
            status,
            docItem.premium ? formatCurrency(docItem.premium) : "N/A",
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [["Document Type", "Provider", "Policy/Number", "Issue Date", "Expiry Date", "Status", "Premium"]],
          body: documentsData,
          theme: "striped",
          headStyles: { fillColor: primaryColor },
          margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // Challans Section
      if (localVehicleReport?.challans && localVehicleReport.challans.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Challans", 14, yPos);
        yPos += 6;

        const challansData = localVehicleReport.challans.map((challan) => [
          challan.challan_number,
          challan.violation_type,
          new Date(challan.date).toLocaleDateString(),
          challan.location,
          formatCurrency(challan.amount),
          challan.status,
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Challan Number", "Violation", "Date", "Location", "Amount", "Status"]],
          body: challansData,
          theme: "striped",
          headStyles: { fillColor: [245, 158, 11] },
          margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // Services Section
      if (localVehicleReport?.services && localVehicleReport.services.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Service History", 14, yPos);
        yPos += 6;

        const servicesData = localVehicleReport.services.map((service) => [
          new Date(service.date).toLocaleDateString(),
          service.service_type,
          service.description || "-",
          service.odometer_reading ? `${service.odometer_reading} km` : "N/A",
          formatCurrency(service.total_cost),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Service Type", "Description", "Odometer", "Cost"]],
          body: servicesData,
          theme: "striped",
          headStyles: { fillColor: [168, 85, 247] },
          margin: { left: 14, right: 14 },
        });
      }

      // Save PDF
      doc.save(`${localVehicleData.registration_number.replace(/[^a-zA-Z0-9]/g, "_")}_full_report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // RC Upload handler
  const handleRcUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingRc(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/vehicles/${localVehicleData.id}/upload-rc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('RC document uploaded successfully');
      setLocalVehicleData(prev => ({
        ...prev,
        rc_document_url: response.data.url,
        rc_document_public_id: response.data.public_id,
        rc_document_uploaded_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('RC upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload RC document');
    } finally {
      setUploadingRc(false);
      if (rcFileInputRef) rcFileInputRef.value = '';
    }
  };

  // RC Download handler
  const handleRcDownload = async () => {
    try {
      setDownloadingRc(true);
      const token = localStorage.getItem('token');
      const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
      const downloadUrl = `${baseURL}/vehicles/${localVehicleData.id}/download-rc`;

      console.log('Downloading RC from:', downloadUrl);

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        throw new Error(`Download failed: ${response.status}`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${localVehicleData.registration_number.replace(/[^a-zA-Z0-9]/g, "_")}_RC.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Use window.document instead of document to avoid conflict
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error) {
      console.error('RC download error:', error);
      toast.error(error.message || 'Failed to download RC document');
    } finally {
      setDownloadingRc(false);
    }
  };

// Document Download handler - FIXED VERSION
const handleDocumentDownload = async (documentId) => {
  try {
    const document = localVehicleReport?.documents?.find((d) => d.id === documentId);
    const docType = document?.document_type || 'document';
    const fileType = document?.file_type; // Get the stored file type

    setDownloadingDocument((prev) => ({ ...prev, [documentId]: true }));

    const token = localStorage.getItem('token');
    const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
    const downloadUrl = `${baseURL}/vehicles/${localVehicleData.id}/download-document/${documentId}`;

    console.log('Downloading document from:', downloadUrl);
    console.log('Document file type:', fileType);

    const response = await fetch(downloadUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Download failed:', response.status, errorText);
      throw new Error(`Download failed: ${response.status}`);
    }

    const contentDisposition = response.headers.get("Content-Disposition");
    
    // Determine file extension
    let extension = 'pdf'; // Default
    
    // First priority: Use stored file_type from document
    if (fileType) {
      if (fileType === 'pdf') extension = 'pdf';
      else if (fileType === 'jpg' || fileType === 'jpeg') extension = 'jpg';
      else if (fileType === 'png') extension = 'png';
      else if (fileType === 'gif') extension = 'gif';
      else extension = fileType;
    }
    // Second priority: Check content type header
    else {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("pdf")) {
        extension = 'pdf';
      } else if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
        extension = 'jpg';
      } else if (contentType?.includes("png")) {
        extension = 'png';
      } else if (contentType?.includes("gif")) {
        extension = 'gif';
      }
    }
    
    // Check URL for extension as fallback
    if (extension === 'pdf') {
      const url = document?.file_url || '';
      if (url.includes('.jpg') || url.includes('.jpeg')) extension = 'jpg';
      else if (url.includes('.png')) extension = 'png';
      else if (url.includes('.gif')) extension = 'gif';
    }

    // Generate filename
    let filename = `${localVehicleData.registration_number.replace(/[^a-zA-Z0-9]/g, "_")}_${docType}.${extension}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        // Use the filename from server but ensure it has correct extension
        let serverFilename = filenameMatch[1].replace(/['"]/g, "");
        // If the server filename doesn't have the correct extension, add it
        if (!serverFilename.toLowerCase().endsWith(`.${extension}`)) {
          const baseName = serverFilename.split('.')[0];
          filename = `${baseName}.${extension}`;
        } else {
          filename = serverFilename;
        }
      }
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`Downloaded as ${filename}`);
  } catch (error) {
    console.error('Document download error:', error);
    toast.error(error.message || 'Failed to download document');
  } finally {
    setDownloadingDocument((prev) => ({ ...prev, [documentId]: false }));
  }
};

  const handleRcDelete = async () => {
    try {
      await api.delete(`/vehicles/${localVehicleData.id}/delete-rc`);
      toast.success('RC document deleted');
      setLocalVehicleData(prev => ({
        ...prev,
        rc_document_url: null,
        rc_document_public_id: null,
        rc_document_uploaded_at: null,
      }));
    } catch (error) {
      toast.error('Failed to delete RC document');
    }
  };

const handleDocumentUpload = async (documentId, documentType) => {
  const fileInput = documentFileInputRefs[documentId];
  const file = fileInput?.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error('File size must be less than 5MB');
    return;
  }

  setUploadingDocument((prev) => ({ ...prev, [documentId]: true }));
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post(
      `/vehicles/${localVehicleData.id}/upload-document/${documentId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    // Get file extension from the uploaded file
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    toast.success(`${documentType} document uploaded successfully`);

    if (localVehicleReport) {
      const updatedDocuments = localVehicleReport.documents.map((doc) => {
        if (doc.id === documentId) {
          return {
            ...doc,
            file_url: response.data.url,
            file_public_id: response.data.public_id,
            file_type: fileExtension, // Store the file extension
            file_uploaded_at: new Date().toISOString(),
          };
        }
        return doc;
      });

      setLocalVehicleReport({
        ...localVehicleReport,
        documents: updatedDocuments,
      });
    }
  } catch (error) {
    toast.error(error.response?.data?.detail || `Failed to upload ${documentType} document`);
  } finally {
    setUploadingDocument((prev) => ({ ...prev, [documentId]: false }));
    if (fileInput) fileInput.value = '';
  }
};

  const handleDocumentDelete = async (documentId, documentType) => {
    try {
      await api.delete(`/vehicles/${localVehicleData.id}/delete-document/${documentId}`);
      toast.success(`${documentType} document deleted successfully`);

      if (localVehicleReport) {
        const updatedDocuments = localVehicleReport.documents.map((doc) => {
          if (doc.id === documentId) {
            return { ...doc, file_url: null, file_public_id: null, file_uploaded_at: null };
          }
          return doc;
        });

        setLocalVehicleReport({ ...localVehicleReport, documents: updatedDocuments });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to delete ${documentType} document`);
    }
  };

  if (!localVehicleData || isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-4xl">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Add these handlers
  const fetchFastagBalance = async () => {
    if (!localVehicleData?.id) return;

    setFetchingFastagBalance(true);
    try {
      const response = await api.post(`/vehicles/${localVehicleData.id}/fastag-balance`);
      setFastagBalanceData(response.data.fastag_data);
      toast.success('FASTag balance fetched successfully');
    } catch (error) {
      console.error('Error fetching FASTag balance:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch FASTag balance');
    } finally {
      setFetchingFastagBalance(false);
    }
  };

  const fetchFastagTransactions = async () => {
    if (!localVehicleData?.id) return;

    setFetchingFastagTransactions(true);
    try {
      const response = await api.post(`/vehicles/${localVehicleData.id}/fastag-transactions`);
      setFastagTransactions(response.data.transactions || []);
      toast.success(`Fetched ${response.data.transaction_count} transactions`);
    } catch (error) {
      console.error('Error fetching FASTag transactions:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch transactions');
    } finally {
      setFetchingFastagTransactions(false);
    }
  };

  const getFastagBalanceColor = (balance) => {
    const numBalance = parseFloat(balance) || 0;
    if (numBalance <= 100) return 'text-rose-600';
    if (numBalance <= 500) return 'text-orange-600';
    return 'text-emerald-600';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Truck size={32} className="text-emerald-700" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-mono">
                  {localVehicleData.registration_number}
                </SheetTitle>
                <p className="text-sm text-slate-600">
                  {localVehicleData.brand} {localVehicleData.model}
                  {localVehicleData.year && ` (${localVehicleData.year})`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-slate-100">{localVehicleData.type}</Badge>
              <Badge variant="outline" className="bg-slate-100">{localVehicleData.fuel_type}</Badge>
              {localVehicleData.source === 'surepass' && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Surepass</Badge>
              )}
              <Button
                size="sm"
                onClick={generatePDF}
                disabled={generatingPDF}
                className="border border-green-500 text-green-600 bg-white hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200"
              >
                <Download size={14} className="mr-1" />
                {generatingPDF ? 'Generating...' : 'PDF'}
              </Button>
              {localVehicleData.source === 'surepass' && (
                <Button
                  size="sm"
                  onClick={onFetchChallans}
                  disabled={fetchingChallans}
                  className="border border-amber-400 text-amber-500 bg-white hover:bg-amber-400 hover:text-white hover:border-amber-400 transition-all duration-200"
                >
                  <AlertTriangle size={14} className="mr-1" />
                  Fetch Challans
                </Button>
              )}
              <Button
                size="sm"
                onClick={onRefresh}
                className="border border-teal-500 text-teal-600 bg-white hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all duration-200"
              >
                <RefreshCw size={14} className="mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">Insurance</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {localVehicleData.insurance_expiry
                        ? new Date(localVehicleData.insurance_expiry).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <Shield size={24} className="text-emerald-600" />
                </div>
                {localVehicleData.insurance_expiry &&
                  getStatusBadge(getDaysLeft(localVehicleData.insurance_expiry))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-700 font-medium">PUC</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {localVehicleData.puc_expiry
                        ? new Date(localVehicleData.puc_expiry).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <FileText size={24} className="text-amber-600" />
                </div>
                {localVehicleData.puc_expiry &&
                  getStatusBadge(getDaysLeft(localVehicleData.puc_expiry))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-700 font-medium">Registration/Fitness</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {localVehicleData.fit_up_to
                        ? new Date(localVehicleData.fit_up_to).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <Calendar size={24} className="text-purple-600" />
                </div>
                {localVehicleData.fit_up_to &&
                  getStatusBadge(getDaysLeft(localVehicleData.fit_up_to))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-rose-700 font-medium">Tax</p>
                    <p className="text-2xl font-bold text-rose-800">
                      {localVehicleData.tax_upto === 'LIFETIME'
                        ? 'Lifetime'
                        : localVehicleData.tax_upto
                          ? new Date(localVehicleData.tax_upto).toLocaleDateString()
                          : 'N/A'}
                    </p>
                  </div>
                  <AlertCircle size={24} className="text-rose-600" />
                </div>
                {localVehicleData.tax_upto && localVehicleData.tax_upto !== 'LIFETIME' &&
                  getStatusBadge(getDaysLeft(localVehicleData.tax_upto))}
                {localVehicleData.tax_upto === 'LIFETIME' && (
                  <Badge className="mt-2 bg-emerald-100 text-emerald-700">Lifetime Tax</Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents ({localVehicleReport?.documents?.length || 0})</TabsTrigger>
              <TabsTrigger value="challans">Challans ({localVehicleReport?.challans?.length || 0})</TabsTrigger>
              <TabsTrigger value="services">Services ({localVehicleReport?.services?.length || 0})</TabsTrigger>
              <TabsTrigger value="fastag">FASTag ({localFastagPasses?.length || 0})</TabsTrigger>
              <TabsTrigger value="accidents">Accidents ({localVehicleReport?.accidents?.length || 0})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Vehicle Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-slate-500">Registration Number</p><p className="font-mono font-medium">{localVehicleData.registration_number}</p></div>
                      <div><p className="text-xs text-slate-500">Owner Name</p><p>{localVehicleData.owner_name || 'N/A'}</p></div>
                      <div><p className="text-xs text-slate-500">Brand/Model</p><p>{localVehicleData.brand} {localVehicleData.model}</p></div>
                      <div><p className="text-xs text-slate-500">Year</p><p>{localVehicleData.year || 'N/A'}</p></div>
                      <div><p className="text-xs text-slate-500">Type</p><p>{localVehicleData.type}</p></div>
                      <div><p className="text-xs text-slate-500">Fuel Type</p><p>{localVehicleData.fuel_type}</p></div>
                      <div><p className="text-xs text-slate-500">Chassis Number</p><p className="font-mono text-xs">{localVehicleData.chassis_number || 'N/A'}</p></div>
                      <div><p className="text-xs text-slate-500">Engine Number</p><p className="font-mono text-xs">{localVehicleData.engine_number || 'N/A'}</p></div>
                      <div><p className="text-xs text-slate-500">Color</p><p>{localVehicleData.color || 'N/A'}</p></div>
                      <div><p className="text-xs text-slate-500">Seating Capacity</p><p>{localVehicleData.seating_capacity || 'N/A'}</p></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div><p className="text-xs text-slate-500">Average Mileage</p><p className="text-xl font-bold">{localVehicleData.average_kmpl || 'N/A'} <span className="text-sm font-normal">km/l</span></p></div>
                    <div><p className="text-xs text-slate-500">Tank Capacity</p><p className="text-xl font-bold">{localVehicleData.tank_capacity_liters || 'N/A'} <span className="text-sm font-normal">L</span></p></div>
                  </CardContent>
                </Card>

                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Registration & Tax</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-slate-500">Date of Registration</p><p>{localVehicleData.date_of_registration ? new Date(localVehicleData.date_of_registration).toLocaleDateString() : 'N/A'}</p></div>
                      <div><p className="text-xs text-slate-500">Tax Validity</p><p>{localVehicleData.tax_upto ? (localVehicleData.tax_upto === 'LIFETIME' ? 'Lifetime' : new Date(localVehicleData.tax_upto).toLocaleDateString()) : 'N/A'}</p></div>
                      <div><p className="text-xs text-slate-500">Registered At</p><p>{localVehicleData.registered_at || 'N/A'}</p></div>
                      <div><p className="text-xs text-slate-500">Source</p><Badge className={localVehicleData.source === 'surepass' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}>{localVehicleData.source || 'Manual'}</Badge></div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2"><FileText size={14} /> RC Document</p>
                        <div className="flex gap-2">
                          <input type="file" ref={(ref) => setRcFileInputRef(ref)} onChange={handleRcUpload} accept="image/*,application/pdf" className="hidden" id="rc-upload" />
                          <Button size="sm" variant="outline" onClick={() => document.getElementById('rc-upload').click()} disabled={uploadingRc}>{uploadingRc ? 'Uploading...' : 'Upload'}</Button>
                          {localVehicleData.rc_document_url && (<><Button size="sm" variant="outline" onClick={handleRcDownload} disabled={downloadingRc}>Download</Button><Button size="sm" variant="outline" className="text-rose-600" onClick={() => setShowRcDeleteDialog(true)}>Delete</Button></>)}
                        </div>
                      </div>
                      <div className={localVehicleData.rc_document_url ? 'bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-sm text-emerald-700' : 'bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm text-amber-700'}>
                        {localVehicleData.rc_document_url ? <><CheckCircle size={14} className="inline mr-1" /> RC document uploaded</> : <><AlertCircle size={14} className="inline mr-1" /> No RC document uploaded</>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">FASTag Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between"><span className="text-xs text-slate-500">Company</span><span className="text-sm font-medium">{localVehicleData.fastag_company || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-500">Balance</span><span className="text-sm font-medium">₹{localVehicleData.fastag_balance?.toLocaleString() || '0'}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-500">Status</span>{localVehicleData.fastag_sold ? <Badge className="bg-amber-100 text-amber-700">Sold</Badge> : localVehicleData.fastag_company ? <Badge className="bg-emerald-100 text-emerald-700">Active</Badge> : <span className="text-xs text-slate-400">Not added</span>}</div>
                  </CardContent>
                </Card>

                {(localVehicleData.site_name || localVehicleData.remark) && (
                  <Card className="col-span-3">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Location & Notes</CardTitle></CardHeader>
                    <CardContent>
                      {localVehicleData.site_name && <div className="flex items-center gap-2 text-sm mb-2"><MapPin size={14} /><span>{localVehicleData.site_name}</span></div>}
                      {localVehicleData.remark && <div className="p-3 bg-amber-50 rounded-lg border border-amber-200"><p className="text-xs text-amber-700 font-medium mb-1">Remark</p><p className="text-sm text-amber-900">{localVehicleData.remark}</p></div>}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              {!localVehicleReport?.documents?.length ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg"><FileText size={48} className="mx-auto text-slate-300 mb-3" /><p>No documents found</p></div>
              ) : (
                <div className="space-y-3">
                  {localVehicleReport.documents.map((doc) => {
                    const daysLeft = getDaysLeft(doc.expiry_date);
                    return (
                      <Card key={doc.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{doc.document_type === 'Custom' ? doc.custom_document_name : doc.document_type}</h4>
                                {doc.is_current && <Badge className="bg-emerald-100 text-emerald-700 text-xs">Current</Badge>}
                                {doc.source === 'surepass' && <Badge className="bg-blue-100 text-blue-700 text-xs">Surepass</Badge>}
                              </div>
                              <p className="text-sm text-slate-600">{doc.policy_number}</p>
                              <p className="text-xs text-slate-500">{doc.provider}</p>
                              <p className="text-xs text-slate-500 mt-1">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(daysLeft)}
                              {doc.premium && <p className="text-sm font-semibold mt-2">₹{doc.premium.toLocaleString()}</p>}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex gap-2">
                              <input type="file" ref={(ref) => { if (ref && documentFileInputRefs[doc.id] !== ref) setDocumentFileInputRefs(prev => ({ ...prev, [doc.id]: ref })); }} onChange={() => handleDocumentUpload(doc.id, doc.document_type)} accept="image/*,application/pdf" className="hidden" id={`doc-upload-${doc.id}`} />
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => document.getElementById(`doc-upload-${doc.id}`).click()} disabled={uploadingDocument[doc.id]}>{uploadingDocument[doc.id] ? 'Uploading...' : <><Upload size={12} className="mr-1" /> Upload</>}</Button>
                              {doc.file_url && (<><Button size="sm" variant="outline" className="flex-1" onClick={() => handleDocumentDownload(doc.id)} disabled={downloadingDocument[doc.id]}><Download size={12} className="mr-1" /> Download</Button><Button size="sm" variant="outline" className="flex-1 text-rose-600" onClick={() => { setDocumentToDelete({ id: doc.id, document_type: doc.document_type, policy_number: doc.policy_number }); setShowDocumentDeleteDialog(true); }}><Trash2 size={12} className="mr-1" /> Delete</Button></>)}
                            </div>
                            {doc.file_url && <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded"><CheckCircle size={12} className="inline mr-1" /> Document uploaded</div>}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Challans Tab */}
            <TabsContent value="challans" className="mt-4">
              {!localVehicleReport?.challans?.length ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg"><AlertTriangle size={48} className="mx-auto text-slate-300 mb-3" /><p>No challans found</p></div>
              ) : (
                <div className="space-y-3">
                  {localVehicleReport.challans.map((challan) => (
                    <Card key={challan.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${challan.status === 'Paid' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                              {challan.status === 'Paid' ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1"><h4 className="font-semibold font-mono">{challan.challan_number}</h4><Badge className={challan.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{challan.status}</Badge></div>
                              <p className="text-sm text-slate-600 mb-1">{challan.violation_type}</p>
                              <p className="text-xs text-slate-500">{new Date(challan.date).toLocaleDateString()} • {challan.location}</p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-rose-600">₹{challan.amount.toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="mt-4">
              {!localVehicleReport?.services?.length ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg"><Wrench size={48} className="mx-auto text-slate-300 mb-3" /><p>No service records</p></div>
              ) : (
                <div className="space-y-3">
                  {localVehicleReport.services.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg"><Wrench size={20} className="text-purple-600" /></div>
                            <div><h4 className="font-semibold">{service.service_type}</h4><p className="text-sm text-slate-600 mb-1">{service.description || 'Service'}</p><p className="text-xs text-slate-500">{new Date(service.date).toLocaleDateString()} • {service.odometer_reading} km</p></div>
                          </div>
                          <p className="text-lg font-bold text-purple-600">₹{service.total_cost?.toLocaleString() || '0'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* FASTag Tab */}
            <TabsContent value="fastag" className="mt-4">
              <div className="space-y-6">
                {/* FASTag Balance & Transactions Section */}
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Zap size={20} className="text-purple-600" />
                        FASTag Live Data
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={fetchFastagBalance}
                          disabled={fetchingFastagBalance}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <RefreshCw size={14} className={`mr-1 ${fetchingFastagBalance ? 'animate-spin' : ''}`} />
                          {fetchingFastagBalance ? 'Fetching...' : 'Fetch Balance'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={fetchFastagTransactions}
                          disabled={fetchingFastagTransactions}
                          className="border-purple-500 text-purple-600"
                        >
                          <RefreshCw size={14} className={`mr-1 ${fetchingFastagTransactions ? 'animate-spin' : ''}`} />
                          {fetchingFastagTransactions ? 'Fetching...' : 'Fetch Transactions'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {fastagBalanceData ? (
                      <div className="space-y-4">
                        {/* Balance Card */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Wallet size={18} className="text-purple-600" />
                              <span className="font-medium text-purple-900">Current Balance</span>
                            </div>
                            <Badge className={fastagBalanceData.tag_status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                              {fastagBalanceData.tag_status || 'Unknown'}
                            </Badge>
                          </div>
                          <p className={`text-3xl font-bold ${getFastagBalanceColor(fastagBalanceData.available_balance)}`}>
                            ₹{parseFloat(fastagBalanceData.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-purple-100">
                            <div>
                              <p className="text-xs text-purple-500">Recharge Limit</p>
                              <p className="font-semibold text-sm">₹{parseFloat(fastagBalanceData.available_recharge_limit || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-purple-500">Bank</p>
                              <p className="font-medium text-sm">{fastagBalanceData.bank_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-purple-500">Tag ID</p>
                              <p className="font-mono text-xs">{fastagBalanceData.tag_id?.slice(-12) || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-purple-500">Vehicle Class</p>
                              <p className="font-medium text-sm">{fastagBalanceData.vehicle_class_desc || fastagBalanceData.vehicle_class || 'N/A'}</p>
                            </div>
                          </div>
                          {fastagBalanceData.customer_name && (
                            <div className="mt-3 pt-3 border-t border-purple-100 flex items-center gap-2">
                              <User size={12} className="text-purple-400" />
                              <p className="text-xs text-purple-600">Owner: {fastagBalanceData.customer_name}</p>
                            </div>
                          )}
                        </div>

                        {/* Transactions */}
                        {(fastagBalanceData.transactions?.length > 0 || fastagTransactions.length > 0) && (
                          <div>
                            <h4 className="font-medium text-sm text-purple-800 mb-3 flex items-center gap-2">
                              <Route size={14} />
                              Recent Transactions
                            </h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {(fastagBalanceData.transactions || fastagTransactions).slice(0, 5).map((txn, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100 hover:shadow-sm transition-shadow">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <MapPin size={12} className="text-slate-400" />
                                        <p className="font-medium text-sm">{txn.toll_plaza_name}</p>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
                                        <span className="flex items-center gap-1">
                                          <Clock size={10} />
                                          {new Date(txn.transaction_date_time).toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <ArrowRight size={10} />
                                          {txn.lane_direction === 'S' ? 'Southbound' : txn.lane_direction === 'N' ? 'Northbound' : txn.lane_direction}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-400 font-mono">
                                        Seq: {txn.seq_no?.slice(-8)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-rose-600">-₹{txn.amount || '??'}</p>
                                      <p className="text-xs text-slate-400">Toll Fee</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(fastagBalanceData.transactions?.length > 5 || fastagTransactions.length > 5) && (
                                <p className="text-center text-xs text-slate-400 mt-2">
                                  Showing last 5 of {fastagBalanceData.transactions?.length || fastagTransactions.length} transactions
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : fetchingFastagBalance ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
                        <p className="text-sm text-slate-500">Fetching FASTag data...</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Zap size={40} className="mx-auto text-purple-200 mb-2" />
                        <p className="text-sm text-slate-500 mb-2">Click "Fetch Balance" to get FASTag details</p>
                        <p className="text-xs text-slate-400">This will fetch current balance and recent transactions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Existing FASTag Passes */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CreditCard size={16} />
                      FASTag Passes
                    </h3>
                    <Button size="sm" onClick={onAddPass} className="bg-emerald-700 hover:bg-emerald-800">
                      <Plus size={14} className="mr-1" /> Add Pass
                    </Button>
                  </div>

                  {!localFastagPasses?.length ? (
                    <div className="text-center py-8 bg-slate-50 rounded-lg">
                      <Zap size={40} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No FASTag passes added</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {localFastagPasses.map((pass) => (
                        <Card key={pass.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{pass.pass_name}</h4>
                                <p className="text-sm text-slate-600">{pass.toll_plaza}</p>
                                <p className="text-xs text-slate-500">Trips: {pass.balance_trips}/{pass.trips_allowed}</p>
                                <p className="text-xs text-slate-500">Expires: {new Date(pass.expiry_date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={pass.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>{pass.status}</Badge>
                                <Button size="sm" variant="ghost" onClick={() => onEditPass(pass)}><Edit size={14} /></Button>
                                <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => onDeletePass(pass.id)}><Trash2 size={14} /></Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Accidents Tab */}
            <TabsContent value="accidents" className="mt-4">
              {!localVehicleReport?.accidents?.length ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg"><AlertCircle size={48} className="mx-auto text-slate-300 mb-3" /><p>No accident records</p></div>
              ) : (
                <div className="space-y-3">
                  {localVehicleReport.accidents.map((accident) => (
                    <Card key={accident.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-rose-100 rounded-lg"><AlertCircle size={20} className="text-rose-600" /></div>
                            <div>
                              <div className="flex items-center gap-2 mb-1"><h4 className="font-semibold">{new Date(accident.date).toLocaleDateString()}</h4><Badge className={accident.claim_status === 'Settled' ? 'bg-emerald-100 text-emerald-700' : accident.claim_status === 'Approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}>{accident.claim_status}</Badge></div>
                              <p className="text-sm text-slate-600 mb-1">{accident.location}</p>
                              <p className="text-xs text-slate-500">{accident.description}</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-rose-600">₹{(accident.damage_estimate || 0).toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Delete Dialogs */}
        <AlertDialog open={showRcDeleteDialog} onOpenChange={setShowRcDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete RC Document</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete the RC document? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRcDelete} className="bg-rose-600">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDocumentDeleteDialog} onOpenChange={setShowDocumentDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete this document? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowDocumentDeleteDialog(false); setDocumentToDelete(null); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={async () => { if (documentToDelete) { await handleDocumentDelete(documentToDelete.id, documentToDelete.document_type); } setShowDocumentDeleteDialog(false); setDocumentToDelete(null); }} className="bg-rose-600">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};
// import React, { useState, useEffect } from 'react';
// import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Switch } from '@/components/ui/switch';
// import { Progress } from '@/components/ui/progress';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import {
//   Truck,
//   FileText,
//   Shield,
//   Calendar,
//   AlertCircle,
//   AlertTriangle,
//   Wrench,
//   Zap,
//   Download,
//   Upload,
//   Eye,
//   EyeOff,
//   Trash2,
//   CheckCircle,
//   XCircle,
//   Info,
//   RefreshCw,
//   MapPin,
//   User,
//   Gauge,
//   Fuel,
//   Plus,
//   Edit,
//   X
// } from 'lucide-react';
// import { toast } from 'sonner';
// import api from '../../utils/api';

// // Helper functions
// const getDaysLeft = (expiryDate) => {
//   if (!expiryDate) return null;
//   const today = new Date();
//   const expiry = new Date(expiryDate);
//   return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
// };

// const getStatusBadge = (daysLeft) => {
//   if (daysLeft === null) return <Badge variant="outline">N/A</Badge>;
//   if (daysLeft <= 0) return <Badge className="bg-rose-100 text-rose-700">Expired</Badge>;
//   if (daysLeft <= 7) return <Badge className="bg-orange-100 text-orange-700">Critical ({daysLeft}d)</Badge>;
//   if (daysLeft <= 15) return <Badge className="bg-amber-100 text-amber-700">Warning ({daysLeft}d)</Badge>;
//   if (daysLeft <= 30) return <Badge className="bg-yellow-100 text-yellow-700">Soon ({daysLeft}d)</Badge>;
//   return <Badge className="bg-emerald-100 text-emerald-700">Valid ({daysLeft}d)</Badge>;
// };

// const formatCurrency = (amount) => {
//   if (!amount && amount !== 0) return "Rs. 0";
//   const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
//   if (isNaN(numAmount)) return "Rs. 0";
//   const formattedNumber = numAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   return `Rs. ${formattedNumber}`;
// };

// export const VehicleDetailSheet = ({
//   vehicle,
//   open,
//   onOpenChange,
//   vehicleReport,
//   fastagPasses,
//   onAddPass,
//   onEditPass,
//   onDeletePass,
//   onRefresh,
//   onFetchChallans,
//   fetchingChallans,
// }) => {
//   const [activeTab, setActiveTab] = useState('overview');
//   const [generatingPDF, setGeneratingPDF] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [localVehicleData, setLocalVehicleData] = useState(null);
//   const [localVehicleReport, setLocalVehicleReport] = useState(null);
//   const [localFastagPasses, setLocalFastagPasses] = useState([]);
//   const [showRcDeleteDialog, setShowRcDeleteDialog] = useState(false);
//   const [showDocumentDeleteDialog, setShowDocumentDeleteDialog] = useState(false);
//   const [documentToDelete, setDocumentToDelete] = useState(null);
//   const [uploadingRc, setUploadingRc] = useState(false);
//   const [uploadingDocument, setUploadingDocument] = useState({});
//   const [downloadingRc, setDownloadingRc] = useState(false);
//   const [downloadingDocument, setDownloadingDocument] = useState({});
//   const [rcFileInputRef, setRcFileInputRef] = useState(null);
//   const [documentFileInputRefs, setDocumentFileInputRefs] = useState({});

//   useEffect(() => {
//     if (vehicle) setLocalVehicleData(vehicle);
//   }, [vehicle]);

//   useEffect(() => {
//     if (vehicleReport) setLocalVehicleReport(vehicleReport);
//   }, [vehicleReport]);

//   useEffect(() => {
//     if (fastagPasses) setLocalFastagPasses(fastagPasses);
//   }, [fastagPasses]);

//   useEffect(() => {
//     if (vehicle && open) {
//       setIsLoading(true);
//       const timer = setTimeout(() => {
//         setIsLoading(false);
//       }, 100);
//       return () => clearTimeout(timer);
//     }
//   }, [vehicle, open]);

//   // Complete PDF Generation
//   const generatePDF = async () => {
//     if (!localVehicleData) return;
    
//     setGeneratingPDF(true);
//     try {
//       const { default: jsPDF } = await import('jspdf');
//       const { default: autoTable } = await import('jspdf-autotable');

//       const doc = new jsPDF({
//         orientation: "portrait",
//         unit: "mm",
//         format: "a4",
//       });

//       const primaryColor = [16, 185, 129];
//       const secondaryColor = [100, 116, 139];

//       // Title
//       doc.setFontSize(20);
//       doc.setTextColor(40, 40, 40);
//       doc.text("Vehicle Full Report", 14, 20);

//       doc.setFontSize(16);
//       doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
//       doc.text(localVehicleData.registration_number, 14, 30);

//       doc.setFontSize(8);
//       doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
//       doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

//       doc.setDrawColor(200, 200, 200);
//       doc.line(14, 38, 196, 38);

//       let yPos = 45;

//       // Vehicle Details
//       doc.setFontSize(14);
//       doc.setTextColor(40, 40, 40);
//       doc.text("Vehicle Details", 14, yPos);
//       yPos += 6;

//       const vehicleDetails = [
//         ["Registration Number", localVehicleData.registration_number],
//         ["Owner Name", localVehicleData.owner_name || "N/A"],
//         ["Brand/Model", `${localVehicleData.brand} ${localVehicleData.model}`],
//         ["Year", localVehicleData.year || "N/A"],
//         ["Type", localVehicleData.type],
//         ["Fuel Type", localVehicleData.fuel_type],
//         ["Color", localVehicleData.color || "N/A"],
//         ["Chassis Number", localVehicleData.chassis_number || "N/A"],
//         ["Engine Number", localVehicleData.engine_number || "N/A"],
//         ["Seating Capacity", localVehicleData.seating_capacity || "N/A"],
//         ["Average Mileage", localVehicleData.average_kmpl ? `${localVehicleData.average_kmpl} km/l` : "N/A"],
//         ["Tank Capacity", localVehicleData.tank_capacity_liters ? `${localVehicleData.tank_capacity_liters} L` : "N/A"],
//         ["Site Name", localVehicleData.site_name || "N/A"],
//         ["Source", localVehicleData.source || "Manual"],
//         ["File Status", localVehicleData.file_status ? "Complete" : "Incomplete"],
//       ];

//       autoTable(doc, {
//         startY: yPos,
//         head: [["Field", "Value"]],
//         body: vehicleDetails,
//         theme: "striped",
//         headStyles: { fillColor: primaryColor },
//         columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
//         margin: { left: 14, right: 14 },
//       });

//       yPos = doc.lastAutoTable.finalY + 10;

//       // Insurance & Tax Details
//       if (yPos > 250) {
//         doc.addPage();
//         yPos = 20;
//       }

//       doc.setFontSize(14);
//       doc.setTextColor(40, 40, 40);
//       doc.text("Insurance & Tax Details", 14, yPos);
//       yPos += 6;

//       const insuranceDetails = [
//         ["Insurance Expiry", localVehicleData.insurance_expiry ? new Date(localVehicleData.insurance_expiry).toLocaleDateString() : "N/A"],
//         ["Insurance Company", localVehicleData.insurance_company || "N/A"],
//         ["Insurance Policy", localVehicleData.insurance_policy_number || "N/A"],
//         ["PUC Expiry", localVehicleData.puc_expiry ? new Date(localVehicleData.puc_expiry).toLocaleDateString() : "N/A"],
//         ["PUCC Number", localVehicleData.pucc_number || "N/A"],
//         ["Tax Validity", localVehicleData.tax_upto === 'LIFETIME' ? 'Lifetime' : (localVehicleData.tax_upto ? new Date(localVehicleData.tax_upto).toLocaleDateString() : "N/A")],
//         ["Fitness Upto", localVehicleData.fit_up_to ? new Date(localVehicleData.fit_up_to).toLocaleDateString() : "N/A"],
//       ];

//       autoTable(doc, {
//         startY: yPos,
//         head: [["Field", "Value"]],
//         body: insuranceDetails,
//         theme: "striped",
//         headStyles: { fillColor: primaryColor },
//         margin: { left: 14, right: 14 },
//       });

//       yPos = doc.lastAutoTable.finalY + 10;

//       // Documents Section
//       if (localVehicleReport?.documents && localVehicleReport.documents.length > 0) {
//         if (yPos > 250) {
//           doc.addPage();
//           yPos = 20;
//         }

//         doc.setFontSize(14);
//         doc.setTextColor(40, 40, 40);
//         doc.text("Documents", 14, yPos);
//         yPos += 6;

//         const documentsData = localVehicleReport.documents.map((docItem) => {
//           const daysLeft = getDaysLeft(docItem.expiry_date);
//           const status = daysLeft === null ? "N/A" : daysLeft <= 0 ? "Expired" : daysLeft < 30 ? "Expiring Soon" : "Active";
//           return [
//             docItem.document_type === "Custom" ? docItem.custom_document_name || "Custom" : docItem.document_type,
//             docItem.provider || "N/A",
//             docItem.policy_number || "N/A",
//             docItem.issue_date ? new Date(docItem.issue_date).toLocaleDateString() : "N/A",
//             docItem.expiry_date ? new Date(docItem.expiry_date).toLocaleDateString() : "N/A",
//             status,
//             docItem.premium ? formatCurrency(docItem.premium) : "N/A",
//           ];
//         });

//         autoTable(doc, {
//           startY: yPos,
//           head: [["Document Type", "Provider", "Policy/Number", "Issue Date", "Expiry Date", "Status", "Premium"]],
//           body: documentsData,
//           theme: "striped",
//           headStyles: { fillColor: primaryColor },
//           margin: { left: 14, right: 14 },
//         });

//         yPos = doc.lastAutoTable.finalY + 10;
//       }

//       // Challans Section
//       if (localVehicleReport?.challans && localVehicleReport.challans.length > 0) {
//         if (yPos > 250) {
//           doc.addPage();
//           yPos = 20;
//         }

//         doc.setFontSize(14);
//         doc.setTextColor(40, 40, 40);
//         doc.text("Challans", 14, yPos);
//         yPos += 6;

//         const challansData = localVehicleReport.challans.map((challan) => [
//           challan.challan_number,
//           challan.violation_type,
//           new Date(challan.date).toLocaleDateString(),
//           challan.location,
//           formatCurrency(challan.amount),
//           challan.status,
//         ]);

//         autoTable(doc, {
//           startY: yPos,
//           head: [["Challan Number", "Violation", "Date", "Location", "Amount", "Status"]],
//           body: challansData,
//           theme: "striped",
//           headStyles: { fillColor: [245, 158, 11] },
//           margin: { left: 14, right: 14 },
//         });

//         yPos = doc.lastAutoTable.finalY + 10;
//       }

//       // Services Section
//       if (localVehicleReport?.services && localVehicleReport.services.length > 0) {
//         if (yPos > 250) {
//           doc.addPage();
//           yPos = 20;
//         }

//         doc.setFontSize(14);
//         doc.setTextColor(40, 40, 40);
//         doc.text("Service History", 14, yPos);
//         yPos += 6;

//         const servicesData = localVehicleReport.services.map((service) => [
//           new Date(service.date).toLocaleDateString(),
//           service.service_type,
//           service.description || "-",
//           service.odometer_reading ? `${service.odometer_reading} km` : "N/A",
//           formatCurrency(service.total_cost),
//         ]);

//         autoTable(doc, {
//           startY: yPos,
//           head: [["Date", "Service Type", "Description", "Odometer", "Cost"]],
//           body: servicesData,
//           theme: "striped",
//           headStyles: { fillColor: [168, 85, 247] },
//           margin: { left: 14, right: 14 },
//         });
//       }

//       // Save PDF
//       doc.save(`${localVehicleData.registration_number.replace(/[^a-zA-Z0-9]/g, "_")}_full_report_${new Date().toISOString().split("T")[0]}.pdf`);
//       toast.success("PDF report generated successfully");
//     } catch (error) {
//       console.error("PDF generation error:", error);
//       toast.error("Failed to generate PDF report");
//     } finally {
//       setGeneratingPDF(false);
//     }
//   };

//   // Fixed RC Upload handler
//   const handleRcUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;
    
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error('File size must be less than 5MB');
//       return;
//     }
    
//     setUploadingRc(true);
//     const formData = new FormData();
//     formData.append('file', file);
    
//     try {
//       const response = await api.post(`/vehicles/${localVehicleData.id}/upload-rc`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
      
//       toast.success('RC document uploaded successfully');
//       setLocalVehicleData(prev => ({
//         ...prev,
//         rc_document_url: response.data.url,
//         rc_document_public_id: response.data.public_id,
//         rc_document_uploaded_at: new Date().toISOString(),
//       }));
//     } catch (error) {
//       console.error('RC upload error:', error);
//       toast.error(error.response?.data?.detail || 'Failed to upload RC document');
//     } finally {
//       setUploadingRc(false);
//       if (rcFileInputRef) rcFileInputRef.value = '';
//     }
//   };

//   // Fixed RC Download handler
//   const handleRcDownload = async () => {
//     try {
//       setDownloadingRc(true);
//       const token = localStorage.getItem('token');
//       const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
//       const downloadUrl = `${baseURL}/vehicles/${localVehicleData.id}/download-rc`;
      
//       console.log('Downloading RC from:', downloadUrl);
      
//       const response = await fetch(downloadUrl, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: "*/*",
//         },
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Download failed:', response.status, errorText);
//         throw new Error(`Download failed: ${response.status}`);
//       }

//       const contentDisposition = response.headers.get("Content-Disposition");
//       let filename = `${localVehicleData.registration_number.replace(/[^a-zA-Z0-9]/g, "_")}_RC.pdf`;
      
//       if (contentDisposition) {
//         const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
//         if (filenameMatch && filenameMatch[1]) {
//           filename = filenameMatch[1].replace(/['"]/g, "");
//         }
//       }

//       const blob = await response.blob();
      
//       if (blob.size === 0) {
//         throw new Error("Downloaded file is empty");
//       }

//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = filename;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       toast.success('Download started');
//     } catch (error) {
//       console.error('RC download error:', error);
//       toast.error(error.message || 'Failed to download RC document');
//     } finally {
//       setDownloadingRc(false);
//     }
//   };

//   // Fixed Document Download handler
//   const handleDocumentDownload = async (documentId) => {
//     try {
//       const document = localVehicleReport?.documents?.find((d) => d.id === documentId);
//       const docType = document?.document_type || 'document';

//       setDownloadingDocument((prev) => ({ ...prev, [documentId]: true }));

//       const token = localStorage.getItem('token');
//       const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
//       const downloadUrl = `${baseURL}/vehicles/${localVehicleData.id}/download-document/${documentId}`;
      
//       console.log('Downloading document from:', downloadUrl);
      
//       const response = await fetch(downloadUrl, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: "*/*",
//         },
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Download failed:', response.status, errorText);
//         throw new Error(`Download failed: ${response.status}`);
//       }

//       const contentDisposition = response.headers.get("Content-Disposition");
//       let filename = `${localVehicleData.registration_number.replace(/[^a-zA-Z0-9]/g, "_")}_${docType}.pdf`;
      
//       if (contentDisposition) {
//         const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
//         if (filenameMatch && filenameMatch[1]) {
//           filename = filenameMatch[1].replace(/['"]/g, "");
//         }
//       }

//       const blob = await response.blob();
      
//       if (blob.size === 0) {
//         throw new Error("Downloaded file is empty");
//       }

//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = filename;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);

//       toast.success('Download started');
//     } catch (error) {
//       console.error('Document download error:', error);
//       toast.error(error.message || 'Failed to download document');
//     } finally {
//       setDownloadingDocument((prev) => ({ ...prev, [documentId]: false }));
//     }
//   };

//   const handleRcDelete = async () => {
//     try {
//       await api.delete(`/vehicles/${localVehicleData.id}/delete-rc`);
//       toast.success('RC document deleted');
//       setLocalVehicleData(prev => ({
//         ...prev,
//         rc_document_url: null,
//         rc_document_public_id: null,
//         rc_document_uploaded_at: null,
//       }));
//     } catch (error) {
//       toast.error('Failed to delete RC document');
//     }
//   };

//   const handleDocumentUpload = async (documentId, documentType) => {
//     const fileInput = documentFileInputRefs[documentId];
//     const file = fileInput?.files[0];
//     if (!file) return;

//     if (file.size > 5 * 1024 * 1024) {
//       toast.error('File size must be less than 5MB');
//       return;
//     }

//     setUploadingDocument((prev) => ({ ...prev, [documentId]: true }));
//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       const response = await api.post(
//         `/vehicles/${localVehicleData.id}/upload-document/${documentId}`,
//         formData,
//         { headers: { 'Content-Type': 'multipart/form-data' } }
//       );

//       toast.success(`${documentType} document uploaded successfully`);

//       if (localVehicleReport) {
//         const updatedDocuments = localVehicleReport.documents.map((doc) => {
//           if (doc.id === documentId) {
//             return {
//               ...doc,
//               file_url: response.data.url,
//               file_public_id: response.data.public_id,
//               file_uploaded_at: new Date().toISOString(),
//             };
//           }
//           return doc;
//         });

//         setLocalVehicleReport({
//           ...localVehicleReport,
//           documents: updatedDocuments,
//         });
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.detail || `Failed to upload ${documentType} document`);
//     } finally {
//       setUploadingDocument((prev) => ({ ...prev, [documentId]: false }));
//       if (fileInput) fileInput.value = '';
//     }
//   };

//   const handleDocumentDelete = async (documentId, documentType) => {
//     try {
//       await api.delete(`/vehicles/${localVehicleData.id}/delete-document/${documentId}`);
//       toast.success(`${documentType} document deleted successfully`);

//       if (localVehicleReport) {
//         const updatedDocuments = localVehicleReport.documents.map((doc) => {
//           if (doc.id === documentId) {
//             return { ...doc, file_url: null, file_public_id: null, file_uploaded_at: null };
//           }
//           return doc;
//         });

//         setLocalVehicleReport({ ...localVehicleReport, documents: updatedDocuments });
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.detail || `Failed to delete ${documentType} document`);
//     }
//   };

//   if (!localVehicleData || isLoading) {
//     return (
//       <Sheet open={open} onOpenChange={onOpenChange}>
//         <SheetContent className="w-full sm:max-w-4xl">
//           <div className="flex items-center justify-center h-full">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
//           </div>
//         </SheetContent>
//       </Sheet>
//     );
//   }

//   return (
//     <Sheet open={open} onOpenChange={onOpenChange}>
//       <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
//         <SheetHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="p-3 bg-emerald-100 rounded-xl">
//                 <Truck size={32} className="text-emerald-700" />
//               </div>
//               <div>
//                 <SheetTitle className="text-2xl font-mono">
//                   {localVehicleData.registration_number}
//                 </SheetTitle>
//                 <p className="text-sm text-slate-600">
//                   {localVehicleData.brand} {localVehicleData.model}
//                   {localVehicleData.year && ` (${localVehicleData.year})`}
//                 </p>
//               </div>
//             </div>
//             <div className="flex gap-2">
//               <Badge variant="outline" className="bg-slate-100">{localVehicleData.type}</Badge>
//               <Badge variant="outline" className="bg-slate-100">{localVehicleData.fuel_type}</Badge>
//               {localVehicleData.source === 'surepass' && (
//                 <Badge className="bg-blue-100 text-blue-700 border-blue-200">Surepass</Badge>
//               )}
//               <Button size="sm" variant="outline" onClick={generatePDF} disabled={generatingPDF}>
//                 <Download size={14} className="mr-1" />
//                 {generatingPDF ? 'Generating...' : 'PDF'}
//               </Button>
//               {localVehicleData.source === 'surepass' && (
//                 <Button size="sm" variant="outline" onClick={onFetchChallans} disabled={fetchingChallans}>
//                   <AlertTriangle size={14} className="mr-1" />
//                   Fetch Challans
//                 </Button>
//               )}
//               <Button size="sm" variant="outline" onClick={onRefresh}>
//                 <RefreshCw size={14} className="mr-1" />
//                 Refresh
//               </Button>
//             </div>
//           </div>
//         </SheetHeader>

//         <div className="mt-6">
//           {/* Quick Stats Cards */}
//           <div className="grid grid-cols-4 gap-4 mb-6">
//             <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs text-emerald-700 font-medium">Insurance</p>
//                     <p className="text-2xl font-bold text-emerald-800">
//                       {localVehicleData.insurance_expiry
//                         ? new Date(localVehicleData.insurance_expiry).toLocaleDateString()
//                         : 'N/A'}
//                     </p>
//                   </div>
//                   <Shield size={24} className="text-emerald-600" />
//                 </div>
//                 {localVehicleData.insurance_expiry &&
//                   getStatusBadge(getDaysLeft(localVehicleData.insurance_expiry))}
//               </CardContent>
//             </Card>

//             <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs text-amber-700 font-medium">PUC</p>
//                     <p className="text-2xl font-bold text-amber-800">
//                       {localVehicleData.puc_expiry
//                         ? new Date(localVehicleData.puc_expiry).toLocaleDateString()
//                         : 'N/A'}
//                     </p>
//                   </div>
//                   <FileText size={24} className="text-amber-600" />
//                 </div>
//                 {localVehicleData.puc_expiry &&
//                   getStatusBadge(getDaysLeft(localVehicleData.puc_expiry))}
//               </CardContent>
//             </Card>

//             <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs text-purple-700 font-medium">Registration</p>
//                     <p className="text-2xl font-bold text-purple-800">
//                       {localVehicleData.fit_up_to
//                         ? new Date(localVehicleData.fit_up_to).toLocaleDateString()
//                         : 'N/A'}
//                     </p>
//                   </div>
//                   <Calendar size={24} className="text-purple-600" />
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-xs text-rose-700 font-medium">Tax</p>
//                     <p className="text-2xl font-bold text-rose-800">
//                       {localVehicleData.tax_upto === 'LIFETIME'
//                         ? 'Lifetime'
//                         : localVehicleData.tax_upto
//                         ? new Date(localVehicleData.tax_upto).toLocaleDateString()
//                         : 'N/A'}
//                     </p>
//                   </div>
//                   <AlertCircle size={24} className="text-rose-600" />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Tabs */}
//           <Tabs value={activeTab} onValueChange={setActiveTab}>
//             <TabsList className="grid grid-cols-6 w-full">
//               <TabsTrigger value="overview">Overview</TabsTrigger>
//               <TabsTrigger value="documents">Documents ({localVehicleReport?.documents?.length || 0})</TabsTrigger>
//               <TabsTrigger value="challans">Challans ({localVehicleReport?.challans?.length || 0})</TabsTrigger>
//               <TabsTrigger value="services">Services ({localVehicleReport?.services?.length || 0})</TabsTrigger>
//               <TabsTrigger value="fastag">FASTag ({localFastagPasses?.length || 0})</TabsTrigger>
//               <TabsTrigger value="accidents">Accidents ({localVehicleReport?.accidents?.length || 0})</TabsTrigger>
//             </TabsList>

//             {/* Overview Tab */}
//             <TabsContent value="overview" className="space-y-6 mt-4">
//               <div className="grid grid-cols-3 gap-4">
//                 <Card className="col-span-2">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm font-medium">Vehicle Specifications</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div><p className="text-xs text-slate-500">Registration Number</p><p className="font-mono font-medium">{localVehicleData.registration_number}</p></div>
//                       <div><p className="text-xs text-slate-500">Owner Name</p><p>{localVehicleData.owner_name || 'N/A'}</p></div>
//                       <div><p className="text-xs text-slate-500">Brand/Model</p><p>{localVehicleData.brand} {localVehicleData.model}</p></div>
//                       <div><p className="text-xs text-slate-500">Year</p><p>{localVehicleData.year || 'N/A'}</p></div>
//                       <div><p className="text-xs text-slate-500">Type</p><p>{localVehicleData.type}</p></div>
//                       <div><p className="text-xs text-slate-500">Fuel Type</p><p>{localVehicleData.fuel_type}</p></div>
//                       <div><p className="text-xs text-slate-500">Chassis Number</p><p className="font-mono text-xs">{localVehicleData.chassis_number || 'N/A'}</p></div>
//                       <div><p className="text-xs text-slate-500">Engine Number</p><p className="font-mono text-xs">{localVehicleData.engine_number || 'N/A'}</p></div>
//                       <div><p className="text-xs text-slate-500">Color</p><p>{localVehicleData.color || 'N/A'}</p></div>
//                       <div><p className="text-xs text-slate-500">Seating Capacity</p><p>{localVehicleData.seating_capacity || 'N/A'}</p></div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm font-medium">Performance</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-3">
//                     <div><p className="text-xs text-slate-500">Average Mileage</p><p className="text-xl font-bold">{localVehicleData.average_kmpl || 'N/A'} <span className="text-sm font-normal">km/l</span></p></div>
//                     <div><p className="text-xs text-slate-500">Tank Capacity</p><p className="text-xl font-bold">{localVehicleData.tank_capacity_liters || 'N/A'} <span className="text-sm font-normal">L</span></p></div>
//                   </CardContent>
//                 </Card>

//                 <Card className="col-span-2">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm font-medium">Registration & Tax</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div><p className="text-xs text-slate-500">Date of Registration</p><p>{localVehicleData.date_of_registration ? new Date(localVehicleData.date_of_registration).toLocaleDateString() : 'N/A'}</p></div>
//                       <div><p className="text-xs text-slate-500">Tax Validity</p><p>{localVehicleData.tax_upto ? (localVehicleData.tax_upto === 'LIFETIME' ? 'Lifetime' : new Date(localVehicleData.tax_upto).toLocaleDateString()) : 'N/A'}</p></div>
//                       <div><p className="text-xs text-slate-500">Registered At</p><p>{localVehicleData.registered_at || 'N/A'}</p></div>
//                       <div><p className="text-xs text-slate-500">Source</p><Badge className={localVehicleData.source === 'surepass' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}>{localVehicleData.source || 'Manual'}</Badge></div>
//                     </div>

//                     <div className="mt-4 pt-4 border-t border-slate-200">
//                       <div className="flex items-center justify-between mb-2">
//                         <p className="text-sm font-medium text-slate-700 flex items-center gap-2"><FileText size={14} /> RC Document</p>
//                         <div className="flex gap-2">
//                           <input type="file" ref={(ref) => setRcFileInputRef(ref)} onChange={handleRcUpload} accept="image/*,application/pdf" className="hidden" id="rc-upload" />
//                           <Button size="sm" variant="outline" onClick={() => document.getElementById('rc-upload').click()} disabled={uploadingRc}>{uploadingRc ? 'Uploading...' : 'Upload'}</Button>
//                           {localVehicleData.rc_document_url && (<><Button size="sm" variant="outline" onClick={handleRcDownload} disabled={downloadingRc}>Download</Button><Button size="sm" variant="outline" className="text-rose-600" onClick={() => setShowRcDeleteDialog(true)}>Delete</Button></>)}
//                         </div>
//                       </div>
//                       <div className={localVehicleData.rc_document_url ? 'bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-sm text-emerald-700' : 'bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm text-amber-700'}>
//                         {localVehicleData.rc_document_url ? <><CheckCircle size={14} className="inline mr-1" /> RC document uploaded</> : <><AlertCircle size={14} className="inline mr-1" /> No RC document uploaded</>}
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm font-medium">FASTag Details</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-2">
//                     <div className="flex justify-between"><span className="text-xs text-slate-500">Company</span><span className="text-sm font-medium">{localVehicleData.fastag_company || 'N/A'}</span></div>
//                     <div className="flex justify-between"><span className="text-xs text-slate-500">Balance</span><span className="text-sm font-medium">₹{localVehicleData.fastag_balance?.toLocaleString() || '0'}</span></div>
//                     <div className="flex justify-between"><span className="text-xs text-slate-500">Status</span>{localVehicleData.fastag_sold ? <Badge className="bg-amber-100 text-amber-700">Sold</Badge> : localVehicleData.fastag_company ? <Badge className="bg-emerald-100 text-emerald-700">Active</Badge> : <span className="text-xs text-slate-400">Not added</span>}</div>
//                   </CardContent>
//                 </Card>

//                 {(localVehicleData.site_name || localVehicleData.remark) && (
//                   <Card className="col-span-3">
//                     <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Location & Notes</CardTitle></CardHeader>
//                     <CardContent>
//                       {localVehicleData.site_name && <div className="flex items-center gap-2 text-sm mb-2"><MapPin size={14} /><span>{localVehicleData.site_name}</span></div>}
//                       {localVehicleData.remark && <div className="p-3 bg-amber-50 rounded-lg border border-amber-200"><p className="text-xs text-amber-700 font-medium mb-1">Remark</p><p className="text-sm text-amber-900">{localVehicleData.remark}</p></div>}
//                     </CardContent>
//                   </Card>
//                 )}
//               </div>
//             </TabsContent>

//             {/* Documents Tab */}
//             <TabsContent value="documents" className="mt-4">
//               {!localVehicleReport?.documents?.length ? (
//                 <div className="text-center py-12 bg-slate-50 rounded-lg"><FileText size={48} className="mx-auto text-slate-300 mb-3" /><p>No documents found</p></div>
//               ) : (
//                 <div className="space-y-3">
//                   {localVehicleReport.documents.map((doc) => {
//                     const daysLeft = getDaysLeft(doc.expiry_date);
//                     return (
//                       <Card key={doc.id}>
//                         <CardContent className="p-4">
//                           <div className="flex items-start justify-between">
//                             <div>
//                               <div className="flex items-center gap-2 mb-1">
//                                 <h4 className="font-semibold">{doc.document_type === 'Custom' ? doc.custom_document_name : doc.document_type}</h4>
//                                 {doc.is_current && <Badge className="bg-emerald-100 text-emerald-700 text-xs">Current</Badge>}
//                                 {doc.source === 'surepass' && <Badge className="bg-blue-100 text-blue-700 text-xs">Surepass</Badge>}
//                               </div>
//                               <p className="text-sm text-slate-600">{doc.policy_number}</p>
//                               <p className="text-xs text-slate-500">{doc.provider}</p>
//                               <p className="text-xs text-slate-500 mt-1">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</p>
//                             </div>
//                             <div className="text-right">
//                               {getStatusBadge(daysLeft)}
//                               {doc.premium && <p className="text-sm font-semibold mt-2">₹{doc.premium.toLocaleString()}</p>}
//                             </div>
//                           </div>

//                           <div className="mt-3 pt-3 border-t border-slate-100">
//                             <div className="flex gap-2">
//                               <input type="file" ref={(ref) => { if (ref && documentFileInputRefs[doc.id] !== ref) setDocumentFileInputRefs(prev => ({ ...prev, [doc.id]: ref })); }} onChange={() => handleDocumentUpload(doc.id, doc.document_type)} accept="image/*,application/pdf" className="hidden" id={`doc-upload-${doc.id}`} />
//                               <Button size="sm" variant="outline" className="flex-1" onClick={() => document.getElementById(`doc-upload-${doc.id}`).click()} disabled={uploadingDocument[doc.id]}>{uploadingDocument[doc.id] ? 'Uploading...' : <><Upload size={12} className="mr-1" /> Upload</>}</Button>
//                               {doc.file_url && (<><Button size="sm" variant="outline" className="flex-1" onClick={() => handleDocumentDownload(doc.id)} disabled={downloadingDocument[doc.id]}><Download size={12} className="mr-1" /> Download</Button><Button size="sm" variant="outline" className="flex-1 text-rose-600" onClick={() => { setDocumentToDelete({ id: doc.id, document_type: doc.document_type, policy_number: doc.policy_number }); setShowDocumentDeleteDialog(true); }}><Trash2 size={12} className="mr-1" /> Delete</Button></>)}
//                             </div>
//                             {doc.file_url && <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded"><CheckCircle size={12} className="inline mr-1" /> Document uploaded</div>}
//                           </div>
//                         </CardContent>
//                       </Card>
//                     );
//                   })}
//                 </div>
//               )}
//             </TabsContent>

//             {/* Challans Tab */}
//             <TabsContent value="challans" className="mt-4">
//               {!localVehicleReport?.challans?.length ? (
//                 <div className="text-center py-12 bg-slate-50 rounded-lg"><AlertTriangle size={48} className="mx-auto text-slate-300 mb-3" /><p>No challans found</p></div>
//               ) : (
//                 <div className="space-y-3">
//                   {localVehicleReport.challans.map((challan) => (
//                     <Card key={challan.id}>
//                       <CardContent className="p-4">
//                         <div className="flex items-start justify-between">
//                           <div className="flex items-start gap-3">
//                             <div className={`p-2 rounded-lg ${challan.status === 'Paid' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
//                               {challan.status === 'Paid' ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
//                             </div>
//                             <div>
//                               <div className="flex items-center gap-2 mb-1"><h4 className="font-semibold font-mono">{challan.challan_number}</h4><Badge className={challan.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{challan.status}</Badge></div>
//                               <p className="text-sm text-slate-600 mb-1">{challan.violation_type}</p>
//                               <p className="text-xs text-slate-500">{new Date(challan.date).toLocaleDateString()} • {challan.location}</p>
//                             </div>
//                           </div>
//                           <p className="text-lg font-bold text-rose-600">₹{challan.amount.toLocaleString()}</p>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </TabsContent>

//             {/* Services Tab */}
//             <TabsContent value="services" className="mt-4">
//               {!localVehicleReport?.services?.length ? (
//                 <div className="text-center py-12 bg-slate-50 rounded-lg"><Wrench size={48} className="mx-auto text-slate-300 mb-3" /><p>No service records</p></div>
//               ) : (
//                 <div className="space-y-3">
//                   {localVehicleReport.services.map((service) => (
//                     <Card key={service.id}>
//                       <CardContent className="p-4">
//                         <div className="flex items-start justify-between">
//                           <div className="flex items-start gap-3">
//                             <div className="p-2 bg-purple-100 rounded-lg"><Wrench size={20} className="text-purple-600" /></div>
//                             <div><h4 className="font-semibold">{service.service_type}</h4><p className="text-sm text-slate-600 mb-1">{service.description || 'Service'}</p><p className="text-xs text-slate-500">{new Date(service.date).toLocaleDateString()} • {service.odometer_reading} km</p></div>
//                           </div>
//                           <p className="text-lg font-bold text-purple-600">₹{service.total_cost?.toLocaleString() || '0'}</p>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </TabsContent>

//             {/* FASTag Tab */}
//             <TabsContent value="fastag" className="mt-4">
//               <div className="flex justify-between items-center mb-4"><h3 className="font-medium">FASTag Passes</h3><Button size="sm" onClick={onAddPass} className="bg-emerald-700 hover:bg-emerald-800"><Plus size={14} className="mr-1" /> Add Pass</Button></div>
//               {!localFastagPasses?.length ? (
//                 <div className="text-center py-12 bg-slate-50 rounded-lg"><Zap size={48} className="mx-auto text-slate-300 mb-3" /><p>No FASTag passes</p></div>
//               ) : (
//                 <div className="space-y-3">
//                   {localFastagPasses.map((pass) => (
//                     <Card key={pass.id}>
//                       <CardContent className="p-4">
//                         <div className="flex items-start justify-between">
//                           <div>
//                             <h4 className="font-semibold">{pass.pass_name}</h4>
//                             <p className="text-sm text-slate-600">{pass.toll_plaza}</p>
//                             <p className="text-xs text-slate-500">Trips: {pass.balance_trips}/{pass.trips_allowed}</p>
//                             <p className="text-xs text-slate-500">Expires: {new Date(pass.expiry_date).toLocaleDateString()}</p>
//                           </div>
//                           <div className="flex gap-2">
//                             <Badge className={pass.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>{pass.status}</Badge>
//                             <Button size="sm" variant="ghost" onClick={() => onEditPass(pass)}><Edit size={14} /></Button>
//                             <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => onDeletePass(pass.id)}><Trash2 size={14} /></Button>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </TabsContent>

//             {/* Accidents Tab */}
//             <TabsContent value="accidents" className="mt-4">
//               {!localVehicleReport?.accidents?.length ? (
//                 <div className="text-center py-12 bg-slate-50 rounded-lg"><AlertCircle size={48} className="mx-auto text-slate-300 mb-3" /><p>No accident records</p></div>
//               ) : (
//                 <div className="space-y-3">
//                   {localVehicleReport.accidents.map((accident) => (
//                     <Card key={accident.id}>
//                       <CardContent className="p-4">
//                         <div className="flex items-start justify-between">
//                           <div className="flex items-start gap-3">
//                             <div className="p-2 bg-rose-100 rounded-lg"><AlertCircle size={20} className="text-rose-600" /></div>
//                             <div>
//                               <div className="flex items-center gap-2 mb-1"><h4 className="font-semibold">{new Date(accident.date).toLocaleDateString()}</h4><Badge className={accident.claim_status === 'Settled' ? 'bg-emerald-100 text-emerald-700' : accident.claim_status === 'Approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}>{accident.claim_status}</Badge></div>
//                               <p className="text-sm text-slate-600 mb-1">{accident.location}</p>
//                               <p className="text-xs text-slate-500">{accident.description}</p>
//                             </div>
//                           </div>
//                           <p className="text-sm font-semibold text-rose-600">₹{(accident.damage_estimate || 0).toLocaleString()}</p>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </TabsContent>
//           </Tabs>
//         </div>

//          {/* Delete Dialogs */}
//         <AlertDialog open={showRcDeleteDialog} onOpenChange={setShowRcDeleteDialog}>
//           <AlertDialogContent>
//             <AlertDialogHeader>
//               <AlertDialogTitle>Delete RC Document</AlertDialogTitle>
//               <AlertDialogDescription>Are you sure you want to delete the RC document? This action cannot be undone.</AlertDialogDescription>
//             </AlertDialogHeader>
//             <AlertDialogFooter>
//               <AlertDialogCancel>Cancel</AlertDialogCancel>
//               <AlertDialogAction onClick={handleRcDelete} className="bg-rose-600">Delete</AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>

//         <AlertDialog open={showDocumentDeleteDialog} onOpenChange={setShowDocumentDeleteDialog}>
//           <AlertDialogContent>
//             <AlertDialogHeader>
//               <AlertDialogTitle>Delete Document</AlertDialogTitle>
//               <AlertDialogDescription>Are you sure you want to delete this document? This action cannot be undone.</AlertDialogDescription>
//             </AlertDialogHeader>
//             <AlertDialogFooter>
//               <AlertDialogCancel onClick={() => { setShowDocumentDeleteDialog(false); setDocumentToDelete(null); }}>Cancel</AlertDialogCancel>
//               <AlertDialogAction onClick={async () => { if (documentToDelete) { await handleDocumentDelete(documentToDelete.id, documentToDelete.document_type); } setShowDocumentDeleteDialog(false); setDocumentToDelete(null); }} className="bg-rose-600">Delete</AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>
//       </SheetContent>
//     </Sheet>
//   );
// };