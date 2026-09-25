"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";

interface PushConfigResponse {
  enabled: boolean;
  vapidPublicKey: string;
}

type PushStatus = "checking" | "unsupported" | "disabled" | "ready" | "subscribed" | "denied" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function canUsePush() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export default function PushNotificationControl() {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [config, setConfig] = useState<PushConfigResponse | null>(null);
  const [message, setMessage] = useState("Verificando push...");
  const [isBusy, setIsBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!canUsePush()) {
      setStatus("unsupported");
      setMessage("Este navegador no soporta push.");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      setMessage("Permiso bloqueado en el navegador.");
      return;
    }

    const response = await fetch("/api/push/config", { cache: "no-store" });

    if (!response.ok) {
      setStatus("error");
      setMessage("No se pudo leer la configuración push.");
      return;
    }

    const nextConfig = (await response.json()) as PushConfigResponse;
    setConfig(nextConfig);

    if (!nextConfig.enabled || !nextConfig.vapidPublicKey) {
      setStatus("disabled");
      setMessage("Push requiere configurar VAPID en el servidor.");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      setStatus("subscribed");
      setMessage("Push activo en este dispositivo.");
    } else {
      setStatus("ready");
      setMessage("Activá alertas del ERP en este dispositivo.");
    }
  }, []);

  useEffect(() => {
    refreshStatus().catch(() => {
      setStatus("error");
      setMessage("No se pudo inicializar push.");
    });
  }, [refreshStatus]);

  const subscribe = async () => {
    if (!config?.vapidPublicKey || !canUsePush()) {
      return;
    }

    setIsBusy(true);
    setMessage("Solicitando permiso...");

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "ready");
        setMessage(permission === "denied" ? "Permiso bloqueado en el navegador." : "Permiso no concedido.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
      });

      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!response.ok) {
        await subscription.unsubscribe();
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "No se pudo guardar la suscripción push.");
      }

      setStatus("subscribed");
      setMessage("Push activo en este dispositivo.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo activar push.");
    } finally {
      setIsBusy(false);
    }
  };

  const unsubscribe = async () => {
    if (!canUsePush()) {
      return;
    }

    setIsBusy(true);

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.endpoint;

      if (subscription) {
        await subscription.unsubscribe();
      }

      await fetch("/api/push/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      setStatus("ready");
      setMessage("Push desactivado en este dispositivo.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo desactivar push.");
    } finally {
      setIsBusy(false);
    }
  };

  const isSubscribed = status === "subscribed";
  const isActionDisabled = isBusy || status === "checking" || status === "unsupported" || status === "disabled" || status === "denied";

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Alertas push</p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{message}</p>
        </div>
        <button
          type="button"
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isActionDisabled}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isBusy || status === "checking" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isSubscribed ? (
            <BellOff className="h-3.5 w-3.5" />
          ) : (
            <BellRing className="h-3.5 w-3.5" />
          )}
          {isSubscribed ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}
