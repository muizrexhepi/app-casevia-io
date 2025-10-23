"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function AppearancePage() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  const themes = [
    {
      id: "light",
      name: "Light",
      description: "Clean and bright interface",
      icon: Sun,
      preview: "bg-white",
    },
    {
      id: "dark",
      name: "Dark",
      description: "Easy on the eyes",
      icon: Moon,
      preview: "bg-slate-900",
    },
    {
      id: "system",
      name: "System",
      description: "Adapt to your system settings",
      icon: Monitor,
      preview: "bg-gradient-to-br from-white to-slate-900",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Appearance
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize how your workspace looks and feels
        </p>
      </div>

      {/* Theme Selection Card */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                Theme
              </h2>
              <p className="text-sm text-muted-foreground">
                Select your preferred color scheme
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.id;

              return (
                <button
                  key={themeOption.id}
                  onClick={() => setTheme(themeOption.id)}
                  className={`relative p-5 rounded-lg border-2 transition-all text-left group ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-accent/50 hover:border-border/80"
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Preview Circle */}
                  <div
                    className={`w-12 h-12 rounded-lg ${themeOption.preview} flex items-center justify-center mb-4 border border-border/50 shadow-sm transition-transform group-hover:scale-105`}
                  >
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        themeOption.id === "light"
                          ? "text-amber-500"
                          : themeOption.id === "dark"
                          ? "text-indigo-400"
                          : "text-slate-600"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-1">
                      {themeOption.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {themeOption.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Theme Info */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                {currentTheme === "dark" ? (
                  <Moon className="w-4 h-4 text-primary" />
                ) : (
                  <Sun className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Currently using{" "}
                  <span className="text-primary font-semibold">
                    {currentTheme === "dark" ? "Dark" : "Light"}
                  </span>{" "}
                  mode
                </p>
                {theme === "system" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically adapting to your system preferences
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                Preview
              </h2>
              <p className="text-sm text-muted-foreground">
                See how your workspace looks
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Sample UI Elements */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  JD
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">John Doe</p>
                <p className="text-xs text-muted-foreground">
                  john@example.com
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-2">
                Sample Card
              </p>
              <p className="text-xs text-muted-foreground">
                This is how cards and containers will appear with your selected
                theme.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors">
                Secondary Button
              </button>
              <button className="px-4 py-2 border border-input bg-background text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                Outlined Button
              </button>
            </div>

            <div className="flex items-center gap-2 p-3 bg-accent rounded-lg border border-border">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-accent-foreground">
                Active status indicator
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Card */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6">
          <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Tips for better experience
          </h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>
                <strong className="text-foreground">System theme</strong>{" "}
                automatically switches between light and dark based on your
                device settings
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>
                <strong className="text-foreground">Dark mode</strong> can
                reduce eye strain during extended use and save battery on OLED
                displays
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>
                <strong className="text-foreground">Light mode</strong> provides
                better readability in bright environments
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
