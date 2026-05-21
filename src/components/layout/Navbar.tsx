"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Menu, Search, FileText, CheckCircle2, Wallet, Check } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/types/erp";

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

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
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
  ]);

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

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const toggleRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <FileText className="w-4 h-4 text-amber-500" />;
      case "payment":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "cash":
        return <Wallet className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 relative z-30">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menu lateral"
          className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Panel de Control
          </h1>
          <p className="text-xs text-slate-500 font-medium">{user.tenantName}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm w-64 outline-none transition-all focus:bg-white focus:shadow-md dark:focus:bg-slate-950"
            placeholder="Buscar..."
            type="text"
          />
        </div>

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones"
            className={`relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200 ${
              showNotifications ? "bg-slate-100 dark:bg-slate-800 text-primary dark:text-white" : ""
            }`}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full border border-white dark:border-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden transform origin-top-right transition-all z-50">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Marcar todas
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center text-slate-500 text-sm">
                    No tenés notificaciones pendientes.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => toggleRead(notification.id)}
                      className={`flex gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        notification.unread ? "bg-slate-50/50 dark:bg-slate-800/20" : ""
                      }`}
                    >
                      <div className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-semibold truncate ${
                            notification.unread ? "text-slate-900 dark:text-white" : "text-slate-500"
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{notification.time}</span>
                        </div>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${
                          notification.unread ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
                        }`}>
                          {notification.description}
                        </p>
                      </div>
                      {notification.unread && (
                        <div className="mt-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <form action={logoutAction}>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}

