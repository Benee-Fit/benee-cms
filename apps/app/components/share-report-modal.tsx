'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Switch } from '@repo/design-system/components/ui/switch';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Share, Copy, Eye, EyeOff, Calendar, Lock, Trash2, ExternalLink, Mail, Plus } from 'lucide-react';
// Simple date formatting helpers
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface ShareReportModalProps {
  reportId: string;
  reportTitle: string;
  children?: React.ReactNode;
}

interface ShareLink {
  id: string;
  shareToken: string;
  isActive: boolean;
  accessCount: number;
  lastAccessedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function ShareReportModal({ reportId, reportTitle, children }: ShareReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    expiresAt: '',
    password: '',
    usePassword: false,
  });

  const [emailData, setEmailData] = useState({
    recipients: [''],
    subject: '',
    message: '',
  });


  const loadShareLinks = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/share`);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.shareLinks || []);
      }
    } catch (error) {
      console.error('Failed to load share links:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadShareLinks();
    }
  }, [isOpen, reportId]);

  const handleCreateShareLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiresAt: formData.expiresAt || null,
          password: formData.usePassword ? formData.password : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const newLink = await response.json();
      setShareLinks([newLink, ...shareLinks]);
      setShowCreateForm(false);
      setFormData({ expiresAt: '', password: '', usePassword: false });
      
      toast.success('Share link created successfully');

    } catch (error) {
      console.error('Failed to create share link:', error);
      toast.error('Failed to create share link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const toggleLinkStatus = async (token: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/share/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        setShareLinks(shareLinks.map(link => 
          link.shareToken === token 
            ? { ...link, isActive: !currentStatus }
            : link
        ));
      }
    } catch (error) {
      toast.error('Failed to update share link');
    }
  };

  const deleteShareLink = async (token: string) => {
    try {
      const response = await fetch(`/api/share/${token}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShareLinks(shareLinks.filter(link => link.shareToken !== token));
        toast.success('Share link deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete share link');
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const addEmailRecipient = () => {
    setEmailData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const updateEmailRecipient = (index: number, value: string) => {
    setEmailData(prev => ({
      ...prev,
      recipients: prev.recipients.map((email, i) => i === index ? value : email)
    }));
  };

  const removeEmailRecipient = (index: number) => {
    setEmailData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const sendEmailShare = async (shareToken: string) => {
    const validRecipients = emailData.recipients.filter(email => email.trim() && email.includes('@'));
    
    if (validRecipients.length === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }

    setEmailLoading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/share/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareToken,
          recipients: validRecipients,
          subject: emailData.subject,
          message: emailData.message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success(`Report shared with ${validRecipients.length} recipient(s)`);

      // Reset email form
      setEmailData({
        recipients: [''],
        subject: '',
        message: '',
      });

    } catch (error) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Share Report: {reportTitle}</DialogTitle>
          <DialogDescription>
            Create and manage share links for this report. You can set expiration dates and passwords for secure sharing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Create New Share Link */}
          <div className="space-y-4">
            {!showCreateForm ? (
              <Button onClick={() => setShowCreateForm(true)} className="w-full">
                <Share className="h-4 w-4 mr-2" />
                Create New Share Link
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create Share Link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiration Date (Optional)</Label>
                    <Input
                      id="expiry"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-password"
                      checked={formData.usePassword}
                      onCheckedChange={(checked) => setFormData({ ...formData, usePassword: checked })}
                    />
                    <Label htmlFor="use-password">Protect with password</Label>
                  </div>

                  {formData.usePassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password..."
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateShareLink}
                      disabled={isLoading || (formData.usePassword && !formData.password)}
                    >
                      {isLoading ? 'Creating...' : 'Create Link'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Existing Share Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Active Share Links</h3>
            {shareLinks.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-6">
                  <p className="text-gray-500">No share links created yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <Card key={link.id} className={!link.isActive || isExpired(link.expiresAt) ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={link.isActive && !isExpired(link.expiresAt) ? 'default' : 'secondary'}>
                              {!link.isActive ? 'Inactive' : isExpired(link.expiresAt) ? 'Expired' : 'Active'}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {link.accessCount} view{link.accessCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            Created {formatDistanceToNow(new Date(link.createdAt))} ago
                            {link.expiresAt && (
                              <span className="ml-2">
                                • Expires {formatDate(new Date(link.expiresAt))}
                              </span>
                            )}
                          </div>

                          {link.lastAccessedAt && (
                            <div className="text-xs text-gray-500">
                              Last accessed {formatDistanceToNow(new Date(link.lastAccessedAt))} ago
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(link.shareToken)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleLinkStatus(link.shareToken, link.isActive)}
                          >
                            {link.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteShareLink(link.shareToken)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}