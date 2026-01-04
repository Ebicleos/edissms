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
import { CreditCard, Save, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
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

  const effectiveSchoolId = schoolId || profile?.school_id;

  useEffect(() => {
    if (effectiveSchoolId) {
      fetchGatewaySettings();
    }
  }, [effectiveSchoolId]);

  const fetchGatewaySettings = async () => {
    if (!effectiveSchoolId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('payment_gateway_provider, payment_gateway_public_key, payment_gateway_secret_key, payment_gateway_webhook_secret, payment_gateway_enabled')
        .eq('id', effectiveSchoolId)
        .single();

      if (error) throw error;

      if (data) {
        setGatewayProvider(data.payment_gateway_provider || 'paystack');
        setPublicKey(data.payment_gateway_public_key || '');
        setSecretKey(''); // Never prefill secret key for security
        setWebhookSecret(''); // Never prefill webhook secret
        setGatewayEnabled(data.payment_gateway_enabled || false);
        setHasExistingKeys(!!data.payment_gateway_secret_key);
      }
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
      const updateData: Record<string, unknown> = {
        payment_gateway_provider: gatewayProvider,
        payment_gateway_public_key: publicKey,
        payment_gateway_enabled: gatewayEnabled,
      };

      // Only update secret keys if new values are provided
      if (secretKey) {
        updateData.payment_gateway_secret_key = secretKey;
      }
      if (webhookSecret) {
        updateData.payment_gateway_webhook_secret = webhookSecret;
      }

      const { error } = await supabase
        .from('schools')
        .update(updateData)
        .eq('id', effectiveSchoolId);

      if (error) throw error;

      setHasExistingKeys(true);
      toast.success('Payment gateway settings saved successfully!');
    } catch (error) {
      console.error('Error saving gateway settings:', error);
      toast.error('Failed to save payment gateway settings');
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
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Students will use your payment gateway to pay fees. Keep your API keys secure and never share them.
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
                Secret Key {hasExistingKeys && <span className="text-muted-foreground">(leave blank to keep current)</span>}
              </Label>
              <PasswordInput
                id="secretKey"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={hasExistingKeys ? '••••••••••••••••' : 'sk_live_xxx or sk_test_xxx'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Starts with sk_live_ (production) or sk_test_ (testing)
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
