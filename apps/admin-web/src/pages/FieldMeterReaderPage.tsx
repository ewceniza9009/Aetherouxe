import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '@elite-realty/shared-ui/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import {
  Camera,
  Wifi,
  WifiOff,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Gauge,
  Droplets,
  Zap,
  ArrowRight,
  ShieldAlert,
  History,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';

interface MeterItem {
  id: string;
  meterNumber: string;
  utilityType: 'water' | 'electricity' | string;
  multiplier: number;
  lastReadingValue: number | null;
  unit?: {
    unitNumber: string;
    building?: { name: string };
  };
  property?: {
    name: string;
    propertyCode: string;
  };
}

interface OfflineReading {
  id: string;
  meterId: string;
  meterNumber: string;
  utilityType: string;
  unitDisplay: string;
  previousReading: number;
  readingValue: number;
  consumption: number;
  isAnomalySpike: boolean;
  notes?: string;
  timestamp: string;
}

const STORAGE_KEY = 'aetherouxe_offline_meter_readings_v1';

export default function FieldMeterReaderPage() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedMeter, setSelectedMeter] = useState<MeterItem | null>(null);
  const [readingInput, setReadingInput] = useState<string>('');
  const [readerNote, setReaderNote] = useState<string>('');
  const [offlineQueue, setOfflineQueue] = useState<OfflineReading[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored. Synchronizing offline queue...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline mode active. Readings will be stored locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial offline queue from storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setOfflineQueue(JSON.parse(stored));
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save offline queue whenever it changes
  const saveQueue = (queue: OfflineReading[]) => {
    setOfflineQueue(queue);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // ignore
    }
  };

  // Fetch meters for route
  const { data: metersResult, isLoading: metersLoading } = useQuery({
    queryKey: ['field-meters-list'],
    queryFn: async () => {
      const res = await api.get('/utility-meters?limit=100');
      return res.data;
    },
  });

  const meters: MeterItem[] = metersResult?.data || [];

  // Batch Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (readings: OfflineReading[]) => {
      const promises = readings.map((r) =>
        api.post('/consumption-readings', {
          meterId: r.meterId,
          readingDate: r.timestamp,
          value: r.readingValue,
          reader: 'Field Mobile Reader',
          note: r.notes || (r.isAnomalySpike ? '[SPIKE CONFIRMED] Verified in field' : undefined),
        }),
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(`Successfully synchronized ${offlineQueue.length} meter readings!`);
      saveQueue([]);
      queryClient.invalidateQueries({ queryKey: ['field-meters-list'] });
      queryClient.invalidateQueries({ queryKey: ['utility-meters'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to sync readings. Queue preserved.');
    },
  });

  // Handle Barcode Scanner toggle
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-viewfinder',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false,
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // Find matching meter by serial number or ID
          const matched = meters.find(
            (m) =>
              m.meterNumber.toLowerCase() === decodedText.trim().toLowerCase() ||
              m.id === decodedText.trim(),
          );

          if (matched) {
            setSelectedMeter(matched);
            setIsScanning(false);
            scanner.clear();
            toast.success(`Identified Meter: ${matched.meterNumber}`);
          } else {
            toast.error(`Meter code "${decodedText}" not found in current route`);
          }
        },
        () => {
          // ignore scan errors
        },
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [isScanning, meters]);

  // Spike Anomaly Detection logic
  const prevReading = Number(selectedMeter?.lastReadingValue || 0);
  const currentReadingNum = parseFloat(readingInput) || 0;
  const currentConsumption = Math.max(
    0,
    (currentReadingNum - prevReading) * (selectedMeter?.multiplier || 1),
  );
  const isNegativeConsumption = readingInput.length > 0 && currentReadingNum < prevReading;
  // Historical average heuristic
  const historicalAvg = selectedMeter?.utilityType === 'water' ? 18 : 160;
  const isSpikeAnomaly = currentConsumption > historicalAvg * 2.5;

  const handleQueueReading = () => {
    if (!selectedMeter) return;
    if (!readingInput || isNaN(Number(readingInput))) {
      toast.error('Please enter a valid numeric meter reading');
      return;
    }
    if (isNegativeConsumption) {
      toast.error('Current reading cannot be lower than the previous reading');
      return;
    }

    const newReading: OfflineReading = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      meterId: selectedMeter.id,
      meterNumber: selectedMeter.meterNumber,
      utilityType: selectedMeter.utilityType,
      unitDisplay: selectedMeter.unit?.unitNumber
        ? `Unit ${selectedMeter.unit.unitNumber}`
        : selectedMeter.property?.propertyCode || 'Common Area',
      previousReading: prevReading,
      readingValue: currentReadingNum,
      consumption: currentConsumption,
      isAnomalySpike: isSpikeAnomaly,
      notes: readerNote,
      timestamp: new Date().toISOString(),
    };

    const updated = [newReading, ...offlineQueue];
    saveQueue(updated);

    toast.success(`Reading for ${selectedMeter.meterNumber} queued!`);
    setSelectedMeter(null);
    setReadingInput('');
    setReaderNote('');

    // If online, auto-trigger sync
    if (isOnline) {
      syncMutation.mutate(updated);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Connectivity Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Field Meter Reader PWA</h1>
            <p className="text-xs text-slate-400">
              Offline-first submeter reading &amp; anomaly detection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Online Mode' : 'Offline Queue Active'}</span>
          </div>

          {offlineQueue.length > 0 && (
            <Button
              size="sm"
              onClick={() => syncMutation.mutate(offlineQueue)}
              disabled={!isOnline || syncMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
            >
              <UploadCloud className="w-4 h-4 mr-1.5" />
              Sync ({offlineQueue.length})
            </Button>
          )}
        </div>
      </div>

      {/* Main Field Reader Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Camera Scanner & Meter Selection */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span>Scan or Select Submeter</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScanning(!isScanning)}
                className="text-xs h-8 gap-1.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                {isScanning ? 'Close Camera' : 'Scan QR Code'}
              </Button>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Point camera at meter barcode or pick from active route list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isScanning && (
              <div className="overflow-hidden rounded-xl border border-emerald-500/30 bg-black p-2">
                <div id="qr-reader-viewfinder" className="w-full h-auto text-slate-300 text-xs" />
              </div>
            )}

            {/* Meter Selection Dropdown / Quick List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Select Meter From Route:
              </label>
              {metersLoading ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/50">
                  {meters.map((meter) => {
                    const isSelected = selectedMeter?.id === meter.id;
                    const isWater = meter.utilityType === 'water';

                    return (
                      <button
                        key={meter.id}
                        onClick={() => setSelectedMeter(meter)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isWater
                                ? 'bg-sky-500/10 text-sky-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {isWater ? (
                              <Droplets className="w-4 h-4" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{meter.meterNumber}</p>
                            <p className="text-[11px] text-slate-400">
                              {meter.unit?.unitNumber
                                ? `Unit ${meter.unit.unitNumber}`
                                : meter.property?.propertyCode || 'Common Area'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400">Last Reading</span>
                          <p className="text-xs font-mono font-bold text-white">
                            {meter.lastReadingValue != null
                              ? Number(meter.lastReadingValue).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : '0.00'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Card: Reading Entry & Anomaly Detection */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <CardTitle className="text-base font-bold text-white">Log Reading</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {selectedMeter
                  ? `Entering reading for ${selectedMeter.meterNumber}`
                  : 'Select a meter on the left to input readings'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {selectedMeter ? (
                <>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Utility Type</span>
                      <span className="font-semibold text-white capitalize">
                        {selectedMeter.utilityType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Previous Reading Value</span>
                      <span className="font-mono font-bold text-white">{prevReading}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Multiplier</span>
                      <span className="font-mono font-bold text-white">
                        {selectedMeter.multiplier}x
                      </span>
                    </div>
                  </div>

                  {/* Numeric Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Current Meter Dial Reading:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`e.g. ${(prevReading + 15).toFixed(2)}`}
                      value={readingInput}
                      onChange={(e) => setReadingInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-lg font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Real-time Computed Consumption */}
                  {readingInput && !isNegativeConsumption && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Calculated Net Consumption:</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        {currentConsumption.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          {selectedMeter.utilityType === 'water' ? 'm³' : 'kWh'}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Negative Consumption Alert */}
                  {isNegativeConsumption && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Reading cannot be lower than the previous reading ({prevReading}).
                      </span>
                    </div>
                  )}

                  {/* Spike Anomaly Warning */}
                  {isSpikeAnomaly && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 animate-pulse">
                      <div className="flex items-center gap-2 font-bold">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Abnormal Consumption Spike Detected (+250% of avg)</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        Please re-verify the meter number and physical dial numbers before queueing.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      Field Notes (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Submeter dial clear, no pipe leaks observed"
                      value={readerNote}
                      onChange={(e) => setReaderNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-slate-600"
                    />
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <QrCode className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs">No meter selected</p>
                </div>
              )}
            </CardContent>
          </div>

          {selectedMeter && (
            <div className="p-4 border-t border-slate-800">
              <Button
                onClick={handleQueueReading}
                disabled={!readingInput || isNegativeConsumption}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isOnline ? 'Submit Reading' : 'Queue in Offline Storage'}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Offline Queue Inspector */}
      {offlineQueue.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
          <CardHeader className="py-3 border-b border-slate-800/60">
            <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Pending Offline Submissions ({offlineQueue.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveQueue([])}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Clear Queue
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800/60">
              {offlineQueue.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{item.meterNumber}</span>
                    <span className="text-slate-400 ml-2">({item.unitDisplay})</span>
                    <p className="text-[11px] text-slate-500">
                      Reading: {item.readingValue} • Net: {item.consumption.toFixed(2)}
                    </p>
                  </div>
                  {item.isAnomalySpike && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                      Spike Confirmed
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
