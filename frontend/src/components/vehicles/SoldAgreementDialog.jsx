import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Trash2, FileText, User, Phone, Calendar, AlertTriangle, Eye, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

export const SoldAgreementDialog = ({ vehicle, open, onOpenChange, onSuccess }) => {
    const [formData, setFormData] = useState({
        buyer_name: '',
        buyer_phone: '',
        agreement_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [uploading, setUploading] = useState(false);
    const [agreementData, setAgreementData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [unsoldDialogOpen, setUnsoldDialogOpen] = useState(false);
    const [markingSold, setMarkingSold] = useState(false);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (open && vehicle?.id) {
            fetchAgreement();
        } else if (!open) {
            // Reset when dialog closes
            setAgreementData(null);
            setIsViewOnly(false);
            setFormData({
                buyer_name: '',
                buyer_phone: '',
                agreement_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
        }
    }, [open, vehicle]);

    const fetchAgreement = async () => {
        if (!vehicle?.id) return;

        setLoading(true);
        try {
            const response = await api.get(`/vehicles/${vehicle.id}/sold-agreement`);
            console.log('Fetched agreement:', response.data);

            if (response.data.has_agreement && response.data.agreement) {
                const agreement = response.data.agreement;
                console.log('Agreement data:', agreement);

                // Format the agreement date properly
                let agreementDate = agreement.agreement_date;
                if (agreementDate) {
                    // Handle different date formats
                    if (agreementDate.includes('T')) {
                        agreementDate = agreementDate.split('T')[0];
                    }
                } else {
                    agreementDate = new Date().toISOString().split('T')[0];
                }

                const newFormData = {
                    buyer_name: agreement.buyer_name || '',
                    buyer_phone: agreement.buyer_phone || '',
                    agreement_date: agreementDate,
                    notes: agreement.notes || ''
                };

                console.log('Setting form data:', newFormData);
                setFormData(newFormData);
                setAgreementData(agreement);
                setIsViewOnly(true);
            } else {
                console.log('No agreement found');
                setAgreementData(null);
                setIsViewOnly(false);
                setFormData({
                    buyer_name: '',
                    buyer_phone: '',
                    agreement_date: new Date().toISOString().split('T')[0],
                    notes: ''
                });
            }
        } catch (error) {
            console.error('Error fetching agreement:', error);
            setAgreementData(null);
            setIsViewOnly(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!vehicle?.id) return;

        setUploading(true);

        try {
            // 1️⃣ Mark vehicle as sold FIRST
            await api.patch(`/vehicles/${vehicle.id}/sold-status`, {
                sold: true
            });

            // 2️⃣ Prepare form data
            const payload = {
                ...formData,
                agreement_date: formData.agreement_date || null
            };

            // 3️⃣ Save agreement details
            await api.post(`/vehicles/${vehicle.id}/sold-agreement`, payload);

            // 4️⃣ Upload file if exists
            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);

                await api.post(
                    `/vehicles/${vehicle.id}/upload-agreement`,
                    uploadFormData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
            }

            toast.success('Vehicle sold & details saved successfully');

            setSelectedFile(null);

            if (onSuccess) onSuccess();
            await fetchAgreement();

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to save');
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        toast.success('File selected (will upload on save)');
    };

    const handleDownload = async () => {
        if (!agreementData?.agreement_url) {
            toast.error('No document available to download');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
            const downloadUrl = `${baseURL}/vehicles/${vehicle.id}/download-agreement`;

            const response = await fetch(downloadUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/pdf",
                },
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${vehicle.registration_number.replace(/[^a-zA-Z0-9]/g, "_")}_sold_agreement.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Download started');
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error.message || 'Failed to download document');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/vehicles/${vehicle.id}/sold-agreement`);
            toast.success('Agreement deleted successfully');
            setAgreementData(null);
            setFormData({
                buyer_name: '',
                buyer_phone: '',
                agreement_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            setIsViewOnly(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete agreement');
        }
    };

    const handleMarkAsUnsold = async () => {
        try {
            await api.patch(`/vehicles/${vehicle.id}/mark-unsold`);

            toast.success('Vehicle marked as unsold');
            setAgreementData(null);
            setFormData({
                buyer_name: '',
                buyer_phone: '',
                agreement_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            setIsViewOnly(false);
            setUnsoldDialogOpen(false);
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error marking as unsold:', error);
            toast.error(error.response?.data?.detail || 'Failed to mark vehicle as unsold');
        }
    };

    const handleEditMode = () => {
        console.log('Entering edit mode with form data:', formData);
        setIsViewOnly(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {agreementData && isViewOnly ? 'Sold Vehicle Details' :
                                agreementData && !isViewOnly ? 'Update Sold Details' :
                                    'Mark Vehicle as Sold'}
                        </DialogTitle>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Vehicle Info Card */}
                            <Card className="bg-emerald-50 border-emerald-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-emerald-700">Vehicle</p>
                                            <p className="font-mono font-bold text-lg">{vehicle?.registration_number}</p>
                                            <p className="text-sm text-emerald-600">{vehicle?.brand} {vehicle?.model}</p>
                                        </div>
                                        {agreementData ? (
                                            <Badge className="bg-emerald-600 text-white">Sold</Badge>
                                        ) : (
                                            <Badge className="bg-amber-600 text-white">Pending Sale</Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Extra spacing between card and form */}
                            <div className="h-2"></div>

                            {/* Agreement Form - Show in edit mode or when not sold */}
                            {(isViewOnly === false || !agreementData) ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="flex items-center gap-2">
                                                <User size={14} /> Buyer Name <span className="text-slate-400 text-xs">(Optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.buyer_name}
                                                onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                                                placeholder="Enter buyer name"
                                            />
                                        </div>
                                        <div>
                                            <Label className="flex items-center gap-2">
                                                <Phone size={14} /> Buyer Phone <span className="text-slate-400 text-xs">(Optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.buyer_phone}
                                                onChange={(e) => setFormData({ ...formData, buyer_phone: e.target.value })}
                                                placeholder="Enter buyer phone number"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="flex items-center gap-2">
                                            <Calendar size={14} /> Agreement Date <span className="text-slate-400 text-xs">(Optional)</span>
                                        </Label>
                                        <Input
                                            type="date"
                                            value={formData.agreement_date}
                                            onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label>Notes <span className="text-slate-400 text-xs">(Optional)</span></Label>
                                        <Textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Additional notes about the sale..."
                                            rows={3}
                                        />
                                    </div>

                                    {/* Document Upload Section */}
                                    <div className="border-t pt-4 mt-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <Label className="font-medium">Agreement Document (PDF only) <span className="text-slate-400 text-xs">(Optional)</span></Label>
                                            {agreementData?.agreement_url && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={handleDownload} type="button">
                                                        <Download size={14} className="mr-1" /> Download
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setDeleteDialogOpen(true)} type="button">
                                                        <Trash2 size={14} className="mr-1" /> Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="agreement-upload"
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={() => document.getElementById('agreement-upload').click()}
                                                disabled={uploading}
                                                className="flex-1"
                                                type="button"
                                            >
                                                <Upload size={14} className="mr-1" />
                                                {uploading ? 'Uploading...' : 'Upload PDF Document'}
                                            </Button>
                                            <p className="text-xs text-slate-500">PDF only (Max 10MB)</p>
                                            {selectedFile && (
                                                <p className="text-sm text-green-600">
                                                    Selected: {selectedFile.name}
                                                </p>
                                            )}
                                        </div>

                                        {agreementData?.agreement_url && (
                                            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-emerald-600" />
                                                    <span className="text-sm text-emerald-700">Document uploaded</span>
                                                </div>
                                                <p className="text-xs text-emerald-600 mt-1">
                                                    PDF file • Uploaded on {new Date(agreementData.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons Container */}
                                    <div className="space-y-2">
                                        <Button
                                            type="submit"
                                            disabled={uploading || markingSold}
                                            className="w-full bg-emerald-700 hover:bg-emerald-800"
                                        >
                                            {markingSold ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                    Marking as Sold...
                                                </>
                                            ) : uploading ? (
                                                'Saving...'
                                            ) : agreementData ? (
                                                'Update Details'
                                            ) : (
                                                'Mark as Sold & Save Details'
                                            )}
                                        </Button>

                                        {/* Mark as Unsold Button - Show in edit mode when agreement exists */}
                                        {agreementData && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                onClick={() => setUnsoldDialogOpen(true)}
                                            >
                                                <XCircle size={16} className="mr-2" />
                                                Mark as Unsold
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                // View Only Mode - Show sold details
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium text-lg">Sold Details</h4>
                                        <div className="flex gap-2">
                                            {/* <Button size="sm" variant="outline" onClick={handleEditMode}>
                                                <Eye size={14} className="mr-1" /> Edit Details
                                            </Button> */}
                                            <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setUnsoldDialogOpen(true)}>
                                                <XCircle size={14} className="mr-1" /> Mark as Unsold
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                                        {agreementData.buyer_name && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Buyer Name:</span>
                                                <span className="font-medium">{agreementData.buyer_name}</span>
                                            </div>
                                        )}
                                        {agreementData.buyer_phone && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Buyer Phone:</span>
                                                <span className="font-medium">{agreementData.buyer_phone}</span>
                                            </div>
                                        )}
                                        {agreementData.agreement_date && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Agreement Date:</span>
                                                <span className="font-medium">
                                                    {new Date(agreementData.agreement_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        {agreementData.notes && (
                                            <div>
                                                <span className="text-slate-600">Notes:</span>
                                                <p className="mt-1 p-2 bg-white rounded text-slate-700">{agreementData.notes}</p>
                                            </div>
                                        )}
                                        {agreementData.created_at && (
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Created on:</span>
                                                <span>{new Date(agreementData.created_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Document Info in View Only Mode */}
                                    {agreementData?.agreement_url && (
                                        <div className="border-t pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <Label className="font-medium">Agreement Document</Label>
                                                <Button size="sm" variant="outline" onClick={handleDownload}>
                                                    <Download size={14} className="mr-1" /> Download PDF
                                                </Button>
                                            </div>
                                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-emerald-600" />
                                                    <span className="text-sm text-emerald-700">Agreement PDF available</span>
                                                </div>
                                                <p className="text-xs text-emerald-600 mt-1">
                                                    Uploaded on {new Date(agreementData.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info message if vehicle is not sold */}
                            {!vehicle?.sold && !agreementData && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                    <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                                    <p className="text-sm text-amber-700">
                                        This vehicle is not yet marked as sold. Fill in the details above and click the button to mark it as sold.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Agreement Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the agreement document? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Mark as Unsold Confirmation Dialog */}
            <AlertDialog open={unsoldDialogOpen} onOpenChange={setUnsoldDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-amber-600 flex items-center gap-2">
                            <AlertTriangle size={20} />
                            Mark Vehicle as Unsold
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>Are you sure you want to mark this vehicle as unsold?</p>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-800 font-medium">This will:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-amber-700">
                                    <li>Remove the sold status from this vehicle</li>
                                    <li>Delete all sold agreement details and documents</li>
                                    <li>Allow you to mark it as sold again with new details later</li>
                                </ul>
                            </div>
                            <p className="text-sm text-rose-600 font-medium">
                                This action cannot be undone. Old sold details will be permanently deleted.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMarkAsUnsold} className="bg-amber-600 hover:bg-amber-700">
                            Yes, Mark as Unsold
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};