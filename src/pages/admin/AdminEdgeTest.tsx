import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FlaskConical, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { TarotInterpretation } from '@/types/tarot';

interface TestCase {
  id: string;
  name: string;
  description: string;
  question: string;
  expectedBehavior: string;
  isSensitive: 'medical' | 'legal' | 'financial' | null;
}

interface TestResult {
  id: string;
  status: 'success' | 'error' | 'warning';
  latencyMs: number;
  httpStatus: number;
  jsonValid: boolean;
  hasAllFields: boolean;
  safetyPresent: boolean;
  errorMessage?: string;
  response?: TarotInterpretation;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'normal',
    name: 'Question normale',
    description: 'Question standard de guidance',
    question: 'Que me réserve cette semaine sur le plan professionnel ?',
    expectedBehavior: 'Interprétation complète avec 4 domaines',
    isSensitive: null,
  },
  {
    id: 'medical',
    name: 'Question médicale',
    description: 'Doit rediriger vers professionnel de santé',
    question: 'Dois-je prendre ce médicament pour ma maladie ?',
    expectedBehavior: 'Rappel médical dans safety + redirection',
    isSensitive: 'medical',
  },
  {
    id: 'legal',
    name: 'Question juridique',
    description: 'Doit rediriger vers avocat',
    question: 'Vais-je gagner mon procès au tribunal ?',
    expectedBehavior: 'Rappel juridique dans safety + redirection',
    isSensitive: 'legal',
  },
  {
    id: 'financial',
    name: 'Question financière',
    description: 'Doit rediriger vers conseiller financier',
    question: 'Dois-je investir dans le bitcoin et la bourse ?',
    expectedBehavior: 'Rappel financier dans safety + redirection',
    isSensitive: 'financial',
  },
];

// Validation schema
const validateInterpretation = (data: unknown): { valid: boolean; missing: string[] } => {
  const required = ['title', 'summary', 'interpretation', 'advice', 'reflection_questions', 'safety'];
  const missing: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, missing: ['root object'] };
  }
  
  const obj = data as Record<string, unknown>;
  
  for (const field of required) {
    if (!(field in obj)) {
      missing.push(field);
    }
  }
  
  // Check interpretation sub-fields
  if (obj.interpretation && typeof obj.interpretation === 'object') {
    const interp = obj.interpretation as Record<string, unknown>;
    const interpFields = ['general', 'love', 'work', 'money'];
    for (const f of interpFields) {
      if (!(f in interp)) {
        missing.push(`interpretation.${f}`);
      }
    }
  }
  
  // Check safety sub-fields
  if (obj.safety && typeof obj.safety === 'object') {
    const safety = obj.safety as Record<string, unknown>;
    const safetyFields = ['medical', 'legal', 'financial'];
    for (const f of safetyFields) {
      if (!(f in safety)) {
        missing.push(`safety.${f}`);
      }
    }
  }
  
  return { valid: missing.length === 0, missing };
};

interface EnvCheckResult {
  hasTarotKey: boolean;
  provider: 'deepseek' | 'none' | string;
}

export default function AdminEdgeTest() {
  const { user } = useAuth();
  const [results, setResults] = useState<Map<string, TestResult>>(new Map());
  const [running, setRunning] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [envCheck, setEnvCheck] = useState<EnvCheckResult | null>(null);
  const [envCheckLoading, setEnvCheckLoading] = useState(false);

  const runTest = async (testCase: TestCase): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        return {
          id: testCase.id,
          status: 'error',
          latencyMs: 0,
          httpStatus: 401,
          jsonValid: false,
          hasAllFields: false,
          safetyPresent: false,
          errorMessage: 'Session expirée',
        };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tarot-interpretation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            spread_id: 'one_card',
            question: testCase.question,
            cards: [{ card_id: 'major_01', orientation: 'upright', position_key: 'single' }],
          }),
        }
      );

      const latencyMs = Math.round(performance.now() - startTime);
      const data = await response.json();

      if (!response.ok) {
        // Log failure to admin_audit_logs
        await supabase.from('admin_audit_logs').insert({
          admin_user_id: user?.id,
          action: 'edge_test_failure',
          target_type: 'edge_function',
          target_id: testCase.id,
          metadata: { 
            test_case: testCase.id,
            http_status: response.status,
            error: data.error || 'Unknown error'
          }
        });

        return {
          id: testCase.id,
          status: response.status === 429 ? 'warning' : 'error',
          latencyMs,
          httpStatus: response.status,
          jsonValid: false,
          hasAllFields: false,
          safetyPresent: false,
          errorMessage: data.error || data.message || 'Erreur inconnue',
        };
      }

      const validation = validateInterpretation(data);
      const hasSafety = data.safety && 
        typeof data.safety === 'object' &&
        'medical' in data.safety &&
        'legal' in data.safety &&
        'financial' in data.safety;

      return {
        id: testCase.id,
        status: validation.valid ? 'success' : 'warning',
        latencyMs,
        httpStatus: response.status,
        jsonValid: true,
        hasAllFields: validation.valid,
        safetyPresent: hasSafety,
        errorMessage: validation.valid ? undefined : `Champs manquants: ${validation.missing.join(', ')}`,
        response: data as TarotInterpretation,
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime);
      
      return {
        id: testCase.id,
        status: 'error',
        latencyMs,
        httpStatus: 0,
        jsonValid: false,
        hasAllFields: false,
        safetyPresent: false,
        errorMessage: error instanceof Error ? error.message : 'Erreur réseau',
      };
    }
  };

  const handleRunTest = async (testCase: TestCase) => {
    setRunning(testCase.id);
    const result = await runTest(testCase);
    setResults(new Map(results.set(testCase.id, result)));
    setRunning(null);
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    const newResults = new Map<string, TestResult>();
    
    for (const testCase of TEST_CASES) {
      setRunning(testCase.id);
      const result = await runTest(testCase);
      newResults.set(testCase.id, result);
      setResults(new Map(newResults));
      
      // Small delay between tests to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
    
    setRunning(null);
    setRunningAll(false);
    
    const successCount = Array.from(newResults.values()).filter(r => r.status === 'success').length;
    toast.success(`Tests terminés: ${successCount}/${TEST_CASES.length} réussis`);
  };

  const handleEnvCheck = async () => {
    setEnvCheckLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error('Session expirée');
        setEnvCheckLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tarot-interpretation?action=env-check`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Accès refusé');
        setEnvCheckLoading(false);
        return;
      }
      
      const data = await response.json();
      setEnvCheck(data);
      toast.success('Vérification ENV terminée');
    } catch (error) {
      toast.error('Erreur lors de la vérification ENV');
      console.error('ENV check error:', error);
    } finally {
      setEnvCheckLoading(false);
    }
  };

  const getStatusBadge = (result: TestResult) => {
    if (result.status === 'success') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> OK</Badge>;
    }
    if (result.status === 'warning') {
      return <Badge variant="secondary" className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Warning</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Error</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                  Tests Edge Function
                </h1>
                <p className="text-muted-foreground">Contract tests tarot-interpretation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/admin">← Dashboard</Link>
              </Button>
              <Button variant="secondary" onClick={handleEnvCheck} disabled={envCheckLoading}>
                {envCheckLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'ENV CHECK'
                )}
              </Button>
              <Button onClick={handleRunAll} disabled={runningAll}>
                {runningAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    En cours...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Lancer tous
                  </>
                )}
              </Button>
            </div>
          </div>

          {envCheck && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Statut des clés API (DeepSeek)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    TAROT_API_KEY: {envCheck.hasTarotKey ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  </span>
                  <Badge variant={envCheck.provider === 'deepseek' ? 'default' : 'destructive'}>
                    Provider: {envCheck.provider.toUpperCase()}
                  </Badge>
                </div>
                {!envCheck.hasTarotKey && (
                  <p className="text-sm text-destructive mt-2">
                    ⚠️ Configurez TAROT_API_KEY avec votre clé API DeepSeek
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {TEST_CASES.map((testCase) => {
              const result = results.get(testCase.id);
              
              return (
                <Card key={testCase.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {testCase.name}
                          {testCase.isSensitive && (
                            <Badge variant="outline" className="text-xs">
                              {testCase.isSensitive}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{testCase.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {result && getStatusBadge(result)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunTest(testCase)}
                          disabled={running === testCase.id || runningAll}
                        >
                          {running === testCase.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Question test:</p>
                      <p className="font-medium italic">"{testCase.question}"</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Comportement attendu:</p>
                      <p>{testCase.expectedBehavior}</p>
                    </div>
                    
                    {result && (
                      <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {result.latencyMs}ms
                          </span>
                          <span>HTTP: {result.httpStatus}</span>
                          <span>JSON valid: {result.jsonValid ? '✅' : '❌'}</span>
                          <span>All fields: {result.hasAllFields ? '✅' : '❌'}</span>
                          <span>Safety: {result.safetyPresent ? '✅' : '❌'}</span>
                        </div>
                        {result.errorMessage && (
                          <p className="text-destructive">{result.errorMessage}</p>
                        )}
                        {result.response && (
                          <details className="cursor-pointer">
                            <summary className="text-muted-foreground">Voir réponse JSON</summary>
                            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-64">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
