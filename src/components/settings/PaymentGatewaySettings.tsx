import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Save, Loader2, CheckCircle2, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentGatewaySettingsProps {
  schoolId?: string;
}

export function PaymentGatewaySettings({ schoolId }: PaymentGatewaySettingsProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Payment gateway settings
  const [gatewayProvider, setGatewayProvider] = useState('paystack');
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [hasExistingKeys, setHasExistingKeys] = useState(false);
  const [keyLastFour, setKeyLastFour] = useState('');

  const effectiveSchoolId = schoolId || profile?.school_id;

  useEffect(() => {
    if (effectiveSchoolId) {
      fetchGatewaySettings();
    } else {
      // Stop loading if no school ID is available
      setIsLoading(false);
    }
  }, [effectiveSchoolId]);

  const fetchGatewaySettings = async () => {
    if (!effectiveSchoolId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch non-secret data from schools table
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('payment_gateway_provider, payment_gateway_public_key, payment_gateway_enabled')
        .eq('id', effectiveSchoolId)
        .maybeSingle();

      if (schoolError) throw schoolError;

      if (schoolData) {
        setGatewayProvider(schoolData.payment_gateway_provider || 'paystack');
        setPublicKey(schoolData.payment_gateway_public_key || '');
        setGatewayEnabled(schoolData.payment_gateway_enabled || false);
      }

      // Fetch masked secret info from secure table (only last 4 chars visible)
      const { data: secretData, error: secretError } = await supabase
        .from('school_payment_secrets')
        .select('key_last_four, webhook_last_four')
        .eq('school_id', effectiveSchoolId)
        .maybeSingle();

      if (!secretError && secretData) {
        setHasExistingKeys(!!secretData.key_last_four);
        setKeyLastFour(secretData.key_last_four || '');
      }

      // Never prefill secret keys for security
      setSecretKey('');
      setWebhookSecret('');
    } catch (error) {
      console.error('Error fetching gateway settings:', error);
      toast.error('Failed to load payment gateway settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!effectiveSchoolId) {
      toast.error('School ID not found');
      return;
    }

    if (gatewayEnabled && !publicKey) {
      toast.error('Public key is required to enable payment gateway');
      return;
    }

    if (gatewayEnabled && !secretKey && !hasExistingKeys) {
      toast.error('Secret key is required to enable payment gateway');
      return;
    }

    setIsSaving(true);
    try {
      // Use Edge Function for secure server-side handling of secrets
      const response = await supabase.functions.invoke('update-payment-secrets', {
        body: {
          school_id: effectiveSchoolId,
          public_key: publicKey,
          provider: gatewayProvider,
          enabled: gatewayEnabled,
          secret_key: secretKey || undefined,
          webhook_secret: webhookSecret || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to save settings');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to save settings');
      }

      // Update local state
      if (response.data?.key_last_four) {
        setKeyLastFour(response.data.key_last_four);
      }

      setHasExistingKeys(true);
      setSecretKey(''); // Clear after saving
      setWebhookSecret(''); // Clear after saving
      toast.success('Payment gateway settings saved securely!');
    } catch (error) {
      console.error('Error saving gateway settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save payment gateway settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!publicKey || (!secretKey && !hasExistingKeys)) {
      toast.error('Please enter your API keys first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await supabase.functions.invoke('validate-payment-gateway', {
        body: {
          provider: gatewayProvider,
          public_key: publicKey,
          secret_key: secretKey || undefined, // Will use stored key if not provided
          school_id: effectiveSchoolId,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.valid) {
        setTestResult('success');
        toast.success('Payment gateway credentials are valid!');
      } else {
        setTestResult('error');
        toast.error(response.data?.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Error testing gateway:', error);
      setTestResult('error');
      toast.error('Failed to verify credentials');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!effectiveSchoolId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-8 w-8 text-warning mb-4" />
          <p className="text-muted-foreground">School not found. Please register your school first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Gateway
            </CardTitle>
            <CardDescription>
              Configure your payment gateway for student fee collection
            </CardDescription>
          </div>
          <Badge variant={gatewayEnabled ? 'default' : 'secondary'}>
            {gatewayEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your API keys are stored securely and encrypted. Secret keys are never displayed after saving.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Enable Payment Gateway</p>
              <p className="text-sm text-muted-foreground">
                Allow students to pay fees online using your payment gateway
              </p>
            </div>
            <Switch
              checked={gatewayEnabled}
              onCheckedChange={setGatewayEnabled}
            />
          </div>

          <div>
            <Label htmlFor="provider">Payment Provider</Label>
            <Select value={gatewayProvider} onValueChange={setGatewayProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paystack">Paystack</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Currently only Paystack is supported
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="publicKey">Public Key</Label>
              <Input
                id="publicKey"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="pk_live_xxx or pk_test_xxx"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Starts with pk_live_ (production) or pk_test_ (testing)
              </p>
            </div>
            <div>
              <Label htmlFor="secretKey">
                Secret Key {hasExistingKeys && <span className="text-muted-foreground">(stored: ****{keyLastFour})</span>}
              </Label>
              <PasswordInput
                id="secretKey"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={hasExistingKeys ? 'Enter new key to update' : 'sk_live_xxx or sk_test_xxx'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {hasExistingKeys ? 'Leave blank to keep current key' : 'Starts with sk_live_ or sk_test_'}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="webhookSecret">
              Webhook Secret (Optional) {hasExistingKeys && <span className="text-muted-foreground">(leave blank to keep current)</span>}
            </Label>
            <PasswordInput
              id="webhookSecret"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_xxx"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Used for additional webhook verification
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || (!publicKey)}
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : testResult === 'success' ? (
                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
              ) : testResult === 'error' ? (
                <XCircle className="mr-2 h-4 w-4 text-destructive" />
              ) : null}
              Test Connection
            </Button>
            {testResult === 'success' && (
              <span className="text-sm text-success">Credentials verified!</span>
            )}
            {testResult === 'error' && (
              <span className="text-sm text-destructive">Verification failed</span>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            className="bg-gradient-primary hover:opacity-90"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}