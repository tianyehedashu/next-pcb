"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Check, X, Edit3, ArrowLeftRight, RefreshCw, Save, CircleX } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExchangeRate, SUPPORTED_CURRENCIES } from '@/types/exchange-rate';

interface DraftRate {
    forward_rate: string;
    forward_active: boolean;
    reverse_rate: string;
    reverse_active: boolean;
}

// Represents a pair of forward and reverse exchange rates
interface RatePair {
  forward: ExchangeRate;
  reverse?: ExchangeRate;
  pairKey: string;
}

interface PreviewData {
    ratesToApply: { base_currency: string, target_currency: string, rate: number }[];
    comparison: { pairKey: string, oldRate: number, newRate: number }[];
}

export default function ExchangeRatesPage() {
  const [ratePairs, setRatePairs] = useState<RatePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftRates, setDraftRates] = useState<Record<string, DraftRate>>({});
  const [newRate, setNewRate] = useState({
    base_currency: 'CNY',
    target_currency: 'USD',
    rate: '7.2000',
    is_active: true,
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingPairs, setSyncingPairs] = useState<Record<string, boolean>>({});
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Group individual rates into pairs
  const groupRatesIntoPairs = (rates: ExchangeRate[]): RatePair[] => {
    const tempPairs: Record<string, { forward?: ExchangeRate, reverse?: ExchangeRate }> = {};

    rates.forEach(rate => {
      const pairKey = [rate.base_currency, rate.target_currency].sort().join('-');
      if (!tempPairs[pairKey]) {
        tempPairs[pairKey] = {};
      }
      if (rate.base_currency < rate.target_currency) {
        tempPairs[pairKey].forward = rate;
      } else {
        tempPairs[pairKey].reverse = rate;
      }
    });

    return Object.entries(tempPairs)
      .filter(([, pair]) => pair.forward)
      .map(([pairKey, pair]) => ({
        forward: pair.forward!,
        reverse: pair.reverse,
        pairKey,
      }))
      .sort((a, b) => a.pairKey.localeCompare(b.pairKey));
  };
  
  const loadExchangeRates = async () => {
    setLoading(true);
    setDraftRates({});
    try {
      const response = await fetch('/api/admin/exchange-rates');
      if (!response.ok) throw new Error('Failed to load exchange rates');
      const data = await response.json();
      const pairs = groupRatesIntoPairs(data.exchangeRates || []);
      setRatePairs(pairs);
    } catch {
      toast.error('Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndApplyExternalRates = async () => {
    setIsSyncing(true);
    toast.info('Fetching latest rates...');
    try {
        const response = await fetch('/api/admin/exchange-rates/sync'); // GET request
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch external rates.');
        }
        const externalData = await response.json();
        
        const newDrafts: Record<string, DraftRate> = {};
        const supportedTargets = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
        let changesCount = 0;

        supportedTargets.forEach(target => {
            if (externalData.rates[target]) {
                const newRateValue = externalData.rates[target];
                const pairKey = `CNY-${target}`;
                const existingPair = ratePairs.find(p => p.pairKey === pairKey);
                
                if (existingPair) {
                    const oldRate = existingPair.forward.rate;
                    if (Math.abs(newRateValue - oldRate) > 0.00001) {
                        newDrafts[pairKey] = {
                            forward_rate: newRateValue.toFixed(4),
                            forward_active: true,
                            reverse_rate: (1 / newRateValue).toFixed(4),
                            reverse_active: true,
                        };
                        changesCount++;
                    }
                }
            }
        });
        
        if (changesCount > 0) {
            setDraftRates(prev => ({...prev, ...newDrafts}));
            toast.success(`Fetched and applied ${changesCount} rate changes for review.`);
        } else {
            toast.success("All fetched rates are already up-to-date.");
        }

    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred during fetch.');
    } finally {
        setIsSyncing(false);
    }
  };

  const syncSinglePair = async (pair: RatePair) => {
    // We assume external rates are always CNY-based.
    const targetCurrency = pair.forward.base_currency === 'CNY'
      ? pair.forward.target_currency
      : pair.forward.base_currency;

    const pairKey = pair.pairKey;

    setSyncingPairs(prev => ({ ...prev, [pairKey]: true }));
    toast.info(`Fetching latest rate for ${pairKey}...`);

    try {
        const response = await fetch(`/api/admin/exchange-rates/sync?target=${targetCurrency}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch rate for ${targetCurrency}.`);
        }
        const externalData = await response.json();

        if (externalData.rates && externalData.rates[targetCurrency]) {
            const newRateValue = externalData.rates[targetCurrency];
            
            const newDraft: DraftRate = {
                forward_rate: newRateValue.toFixed(4),
                forward_active: true,
                reverse_rate: (1 / newRateValue).toFixed(4),
                reverse_active: true,
            };

            setDraftRates(prev => ({...prev, [pairKey]: newDraft}));
            toast.success(`Fetched and applied new rate for ${pairKey}.`);

        } else {
            throw new Error(`Rate for ${targetCurrency} not found in response.`);
        }
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setSyncingPairs(prev => ({ ...prev, [pairKey]: false }));
    }
  };

  const handleApiCall = async (endpoint: string, method: 'POST' | 'PATCH', body: object) => {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${method} ${endpoint}`);
    }
    return response.json();
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    const promises = [];
    const changedKeys = Object.keys(draftRates);

    for (const pairKey of changedKeys) {
        const draft = draftRates[pairKey];
        const originalPair = ratePairs.find(p => p.pairKey === pairKey);
        if (!originalPair) continue;

        // Save forward rate
        promises.push(handleApiCall(`/api/admin/exchange-rates/${originalPair.forward.id}`, 'PATCH', {
            rate: parseFloat(draft.forward_rate),
            is_active: draft.forward_active,
            source: 'manual',
        }));

        // Save reverse rate
        if (originalPair.reverse) {
            promises.push(handleApiCall(`/api/admin/exchange-rates/${originalPair.reverse.id}`, 'PATCH', {
                rate: parseFloat(draft.reverse_rate),
                is_active: draft.reverse_active,
                source: 'manual_sync',
            }));
        } else {
            promises.push(handleApiCall('/api/admin/exchange-rates', 'POST', {
                base_currency: originalPair.forward.target_currency,
                target_currency: originalPair.forward.base_currency,
                rate: parseFloat(draft.reverse_rate),
                is_active: draft.reverse_active,
                source: 'manual_sync',
            }));
        }
    }
    
    try {
        await Promise.all(promises);
        toast.success(`Successfully saved changes for ${changedKeys.length} pairs.`);
        await loadExchangeRates(); // This also clears draftRates
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save some changes.');
    } finally {
        setIsSaving(false);
    }
  };

  const saveSinglePair = async (pairKey: string) => {
    const draft = draftRates[pairKey];
    if (!draft) return;

    setSyncingPairs(prev => ({ ...prev, [pairKey]: true }));

    const originalPair = ratePairs.find(p => p.pairKey === pairKey);
    if (!originalPair) {
        toast.error("Original pair not found.");
        setSyncingPairs(prev => ({ ...prev, [pairKey]: false }));
        return;
    }

    try {
        const promises = [];
        // Save forward rate
        promises.push(handleApiCall(`/api/admin/exchange-rates/${originalPair.forward.id}`, 'PATCH', {
            rate: parseFloat(draft.forward_rate),
            is_active: draft.forward_active,
            source: 'manual',
        }));

        // Save reverse rate
        if (originalPair.reverse) {
            promises.push(handleApiCall(`/api/admin/exchange-rates/${originalPair.reverse.id}`, 'PATCH', {
                rate: parseFloat(draft.reverse_rate),
                is_active: draft.reverse_active,
                source: 'manual_sync',
            }));
        } else {
            promises.push(handleApiCall('/api/admin/exchange-rates', 'POST', {
                base_currency: originalPair.forward.target_currency,
                target_currency: originalPair.forward.base_currency,
                rate: parseFloat(draft.reverse_rate),
                is_active: draft.reverse_active,
                source: 'manual_sync',
            }));
        }

        await Promise.all(promises);
        toast.success(`Pair ${pairKey} updated successfully!`);

        // Remove from draft state and reload list
        const newDrafts = { ...draftRates };
        delete newDrafts[pairKey];
        setDraftRates(newDrafts);
        
        // A full reload is safer for now to ensure data consistency
        if (Object.keys(newDrafts).length === 0) {
            await loadExchangeRates();
        }

    } catch (error) {
        toast.error(error instanceof Error ? error.message : `Failed to save ${pairKey}.`);
    } finally {
        setSyncingPairs(prev => ({ ...prev, [pairKey]: false }));
    }
  };

  const cancelEdit = (pairKey: string) => {
    const newDrafts = { ...draftRates };
    delete newDrafts[pairKey];
    setDraftRates(newDrafts);
  };

  const createNewRatePair = async () => {
    setIsSaving(true);
    try {
        const rateValue = parseFloat(newRate.rate);
        if (isNaN(rateValue) || rateValue <= 0) throw new Error('Rate must be a positive number.');
        if (newRate.base_currency === newRate.target_currency) throw new Error('Currencies must be different.');

        let base = newRate.base_currency;
        let target = newRate.target_currency;
        let rate = rateValue;

        if (base > target) {
            [base, target] = [target, base];
            rate = 1 / rate;
        }

        await handleApiCall('/api/admin/exchange-rates', 'POST', {
            base_currency: base,
            target_currency: target,
            rate: rate,
            is_active: newRate.is_active,
            source: 'manual',
        });
        
        toast.success('New exchange rate created.');
        setShowNewForm(false);
        setNewRate({ base_currency: 'CNY', target_currency: 'USD', rate: '7.2000', is_active: true });
        await loadExchangeRates();
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create rate.');
    } finally {
        setIsSaving(false);
    }
  };

  const startEdit = (pair: RatePair) => {
    setDraftRates(prev => ({
        ...prev,
        [pair.pairKey]: {
            forward_rate: pair.forward.rate.toFixed(4),
            forward_active: pair.forward.is_active,
            reverse_rate: (pair.reverse?.rate ?? 1 / pair.forward.rate).toFixed(4),
            reverse_active: pair.reverse?.is_active ?? pair.forward.is_active,
        }
    }))
  };

  const onDraftValueChange = (pairKey: string, side: 'forward' | 'reverse', key: 'rate' | 'active', value: string | boolean) => {
    if (!draftRates[pairKey]) return;

    const newDraft = { ...draftRates[pairKey] };

    if (key === 'rate' && typeof value === 'string') {
        const numValue = parseFloat(value);
        if (side === 'forward') {
            newDraft.forward_rate = value;
            if (!isNaN(numValue) && numValue > 0) {
                newDraft.reverse_rate = (1 / numValue).toFixed(4);
            }
        } else { // reverse
            newDraft.reverse_rate = value;
            if (!isNaN(numValue) && numValue > 0) {
                newDraft.forward_rate = (1 / numValue).toFixed(4);
            }
        }
    } else if (key === 'active' && typeof value === 'boolean') {
        if (side === 'forward') {
            newDraft.forward_active = value;
        } else {
            newDraft.reverse_active = value;
        }
    }

    setDraftRates(prev => ({...prev, [pairKey]: newDraft }));
  };

  useEffect(() => {
    loadExchangeRates();
  }, []);
  
  const hasPendingChanges = Object.keys(draftRates).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Exchange Rate Management</h1>
          <p className="text-sm text-gray-500">Manage currency pairs with automatic bidirectional sync.</p>
        </div>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-100/80 border-b p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Currency Pairs</CardTitle>
              <div className="flex items-center gap-2">
                {hasPendingChanges && (
                    <>
                     <Button onClick={saveAllChanges} variant="default" size="sm" disabled={isSaving || loading} className="bg-blue-600 hover:bg-blue-700">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                        Save All Changes
                     </Button>
                     <Button onClick={() => setDraftRates({})} variant="outline" size="sm" disabled={isSaving || loading}>
                        <CircleX className="w-4 h-4 mr-2" />
                        Discard All Changes
                     </Button>
                     <div className="h-6 border-l border-gray-300 mx-2"></div>
                    </>
                )}
                <Button onClick={fetchAndApplyExternalRates} variant="outline" size="sm" disabled={isSyncing || loading || isSaving}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    Fetch External Rates
                </Button>
                <Button onClick={() => setShowNewForm(!showNewForm)} size="sm" disabled={isSyncing || loading || isSaving}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rate
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {showNewForm && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600">From</label>
                        <Select value={newRate.base_currency} onValueChange={(v) => setNewRate(p => ({...p, base_currency: v}))}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>{SUPPORTED_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600">To</label>
                        <Select value={newRate.target_currency} onValueChange={(v) => setNewRate(p => ({...p, target_currency: v}))}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>{SUPPORTED_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600">Rate</label>
                        <Input className="h-9 font-mono" type="text" value={newRate.rate} onChange={(e) => setNewRate(p => ({...p, rate: e.target.value}))} />
                    </div>
                    <Button onClick={createNewRatePair} className="bg-blue-600 hover:bg-blue-700" size="icon" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button onClick={() => setShowNewForm(false)} variant="ghost" size="icon" disabled={isSaving}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
                {loading ? (
                    <div className="flex justify-center items-center py-12 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mr-3" /><span>Loading...</span></div>
                ) : ratePairs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500"><p className="text-lg">No currency pairs found.</p></div>
                ) : (
                    ratePairs.map(pair => {
                        const isEditingThisPair = !!draftRates[pair.pairKey];
                        const draft = draftRates[pair.pairKey];
                        const isSyncingThisPair = !!syncingPairs[pair.pairKey];

                        return (
                            <div key={pair.pairKey} className={`p-2 rounded-lg border transition-all ${isEditingThisPair ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center gap-4">
                                    {/* Forward Rate */}
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="font-semibold text-gray-700 w-28 shrink-0">{pair.forward.base_currency} → {pair.forward.target_currency}</div>
                                        {isEditingThisPair ? (
                                            <Input type="text" value={draft.forward_rate} onChange={e => onDraftValueChange(pair.pairKey, 'forward', 'rate', e.target.value)} className="font-mono h-9"/>
                                        ) : (
                                            <div className="text-lg font-mono text-blue-600 w-24">{pair.forward.rate.toFixed(4)}</div>
                                        )}
                                        {isEditingThisPair ? (
                                             <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={draft.forward_active} onChange={e => onDraftValueChange(pair.pairKey, 'forward', 'active', e.target.checked)} className="h-4 w-4 rounded"/>Active</label>
                                        ) : (
                                            <Badge variant={pair.forward.is_active ? "default" : "secondary"}>{pair.forward.is_active ? "Active" : "Inactive"}</Badge>
                                        )}
                                    </div>
                                    
                                    {/* Arrow */}
                                    <ArrowLeftRight className="w-5 h-5 text-gray-300 shrink-0" />
                                    
                                    {/* Reverse Rate */}
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="font-semibold text-gray-700 w-28 shrink-0">{pair.forward.target_currency} → {pair.forward.base_currency}</div>
                                        {isEditingThisPair ? (
                                            <Input type="text" value={draft.reverse_rate} onChange={e => onDraftValueChange(pair.pairKey, 'reverse', 'rate', e.target.value)} className="font-mono h-9"/>
                                        ) : (
                                            pair.reverse ? (
                                                <div className="text-lg font-mono text-purple-600 w-24">{pair.reverse.rate.toFixed(4)}</div>
                                            ) : (
                                                <div className="text-sm text-gray-500 w-24">Not set</div>
                                            )
                                        )}
                                        {isEditingThisPair ? (
                                             <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={draft.reverse_active} onChange={e => onDraftValueChange(pair.pairKey, 'reverse', 'active', e.target.checked)} className="h-4 w-4 rounded"/>Active</label>
                                        ) : (
                                            pair.reverse ? (
                                                <Badge variant={pair.reverse.is_active ? "default" : "secondary"}>{pair.reverse.is_active ? "Active" : "Inactive"}</Badge>
                                            ) : <div className="w-[68px]"></div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="w-24 text-right">
                                        {isEditingThisPair ? (
                                            <div className="flex gap-2 justify-end">
                                                <Button 
                                                    onClick={() => saveSinglePair(pair.pairKey)} 
                                                    variant="default" 
                                                    size="icon" 
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    disabled={isSyncingThisPair || isSaving}
                                                    title={`Save ${pair.pairKey}`}
                                                >
                                                    {isSyncingThisPair ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                                                </Button>
                                                <Button 
                                                    onClick={() => cancelEdit(pair.pairKey)} 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    disabled={isSyncingThisPair || isSaving}
                                                    title={`Cancel edit for ${pair.pairKey}`}
                                                >
                                                    <X className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 justify-end">
                                                <Button 
                                                    onClick={() => syncSinglePair(pair)} 
                                                    variant="outline" 
                                                    size="icon" 
                                                    disabled={isSyncingThisPair || isSyncing || isSaving} 
                                                    title={`Sync ${pair.pairKey}`}
                                                >
                                                    {isSyncingThisPair ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                                                </Button>
                                                <Button 
                                                    onClick={() => startEdit(pair)} 
                                                    variant="outline" 
                                                    size="icon" 
                                                    disabled={isSyncingThisPair || isSyncing || isSaving} 
                                                    title={`Edit ${pair.pairKey}`}
                                                >
                                                    <Edit3 className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!previewData} onOpenChange={(isOpen) => !isOpen && setPreviewData(null)}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Confirm External Sync</DialogTitle>
                    <DialogDescription>
                        Review the changes from the external source before applying them. Only rates with changes are shown.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Currency Pair</TableHead>
                                <TableHead className="text-right">Current Rate</TableHead>
                                <TableHead className="text-right">New Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {previewData?.comparison.map(item => (
                                <TableRow key={item.pairKey}>
                                    <TableCell className="font-medium">{item.pairKey.replace('-', ' → ')}</TableCell>
                                    <TableCell className="text-right font-mono">{item.oldRate > 0 ? item.oldRate.toFixed(4) : 'Not Set'}</TableCell>
                                    <TableCell className="text-right font-mono flex items-center justify-end gap-2">
                                        <ArrowRight className="w-4 h-4 text-gray-400"/>
                                        <span className="text-green-600 font-bold">{item.newRate.toFixed(4)}</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setPreviewData(null)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={() => {}} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm & Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
} 