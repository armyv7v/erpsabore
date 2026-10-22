"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Menu, FileText, CheckCircle2, Wallet, Check, Trash2 } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import PushNotificationControl from "@/components/notifications/PushNotificationControl";
import { screenTitle } from "@/lib/navigation";
import type { AuthUser } from "@/lib/types/erp";
import { usePathname } from "next/navigation";

interface NavbarProps {
  user: AuthUser;
  onMenuClick?: () => void;
}

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: "invoice" | "payment" | "cash";
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: "Nueva factura borrador",
    description: "Se creó el borrador FV-2026-0004 por CLP 150.000.",
    time: "Hace 5 min",
    unread: true,
    type: "invoice",
  },
  {
    id: 2,
    title: "Pago registrado",
    description: "FV-2026-0002 marcada como pagada (CLP 450.000).",
    time: "Hace 1 hora",
    unread: true,
    type: "payment",
  },
  {
    id: 3,
    title: "Arqueo de caja",
    description: "Cierre de caja de sucursal Centro completado.",
    time: "Hace 3 horas",
    unread: false,
    type: "cash",
  },
];

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  const clearReadNotifications = () => setNotifications(notifications.filter((n) => n.unread));
  const deleteNotification = (id: number) =>
    setNotifications(notifications.filter((n) => n.id !== id));
  const toggleRead = (id: number) =>
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)));

  const typeIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <FileText className="h-4 w-4 text-muted" aria-hidden="true" />;
      case "payment":
        return <CheckCircle2 className="h-4 w-4 text-muted" aria-hidden="true" />;
      case "cash":
        return <Wallet className="h-4 w-4 text-muted" aria-hidden="true" />;
      default:
        return <Bell className="h-4 w-4 text-muted" aria-hidden="true" />;
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-3 md:px-4">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú lateral"
        className="flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-slate-900/[0.06] hover:text-ink md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="min-w-0 pl-1">
        <h1 className="truncate text-[16px] font-semibold leading-tight text-ink">
          {screenTitle(pathname)}
        </h1>
        <p className="truncate text-[11px] leading-tight text-muted">
          {user.tenantName} · {user.fullName}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
            aria-expanded={showNotifications}
            className={`relative flex min-w-11 min-h-11 items-center justify-center rounded-control transition-colors hover:bg-slate-900/[0.06] ${showNotifications ? "bg-slate-900/[0.06] text-ink" : "text-muted"}`}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-chip bg-[var(--color-negative)] px-1 text-xs font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 z-50 mt-1.5 w-80 overflow-hidden rounded-card border border-border bg-white shadow-[0_8px_24px_rgba(28,21,18,0.12)] md:w-96">
              <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
                <span className="text-[13px] font-semibold text-ink">Notificaciones</span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-ink"
                    >
                      <Check className="h-3.5 w-3.5" /> Marcar todas
                    </button>
                  )}
                  {notifications.some((n) => !n.unread) && (
                    <button
                      type="button"
                      onClick={clearReadNotifications}
                      className="flex items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-ink"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar leídas
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[13px] text-muted">
                    Sin notificaciones pendientes.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="group relative flex gap-3 border-b border-rule px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
                    >
                      <span className="mt-0.5 shrink-0">{typeIcon(notification.type)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={`truncate text-[13px] ${
                              notification.unread ? "font-medium text-ink" : "text-muted"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <span className="shrink-0 text-[11px] text-muted">{notification.time}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">
                          {notification.description}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleRead(notification.id)}
                            className="text-[11px] font-medium text-muted transition-colors hover:text-ink"
                          >
                            {notification.unread ? "Marcar leída" : "Marcar no leída"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNotification(notification.id)}
                            aria-label="Eliminar notificación"
                            className="text-[11px] text-muted transition-colors hover:text-ink"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <PushNotificationControl />
            </div>
          )}
        </div>

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-edge" />

        <form action={logoutAction}>
          <button className="flex h-9 items-center gap-2 rounded-control px-2.5 text-[13px] font-medium text-muted transition-colors hover:bg-slate-900/[0.06] hover:text-ink">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
