// src/components/settings/network.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import  Switch  from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NetworkSettings {
  dns: {
    useDNS: boolean;
    primaryDNS: string;
    secondaryDNS: string;
  };
  proxy: {
    enabled: boolean;
    type: "http" | "socks";
    host: string;
    port: string;
    requiresAuth: boolean;
    username?: string;
    password?: string;
  };
  cookies: {
    allowThirdParty: boolean;
    clearOnExit: boolean;
    blockTracking: boolean;
  };
}

export default function NetworkSettings() {
  const { t } = useTranslation();

  const [settings, setSettings] = React.useState<NetworkSettings>({
    dns: {
      useDNS: false,
      primaryDNS: "8.8.8.8",
      secondaryDNS: "8.8.4.4",
    },
    proxy: {
      enabled: false,
      type: "http",
      host: "",
      port: "",
      requiresAuth: false,
      username: "",
      password: "",
    },
    cookies: {
      allowThirdParty: false,
      clearOnExit: true,
      blockTracking: true,
    },
  });

  const handleDNSChange = (field: keyof typeof settings.dns, value: any) => {
    setSettings((prev) => ({
      ...prev,
      dns: { ...prev.dns, [field]: value },
    }));
  };

  const handleProxyChange = (field: keyof typeof settings.proxy, value: any) => {
    setSettings((prev) => ({
      ...prev,
      proxy: { ...prev.proxy, [field]: value },
    }));
  };

  const handleCookieChange = (
    field: keyof typeof settings.cookies,
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      cookies: { ...prev.cookies, [field]: value },
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save settings
      console.log("Saving settings:", settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* DNS Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("network.dns.title", "DNS Configuration")}</CardTitle>
          <CardDescription>
            {t(
              "network.dns.description",
              "Configure custom DNS servers for better performance or privacy"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>
              {t("network.dns.useCustom", "Use Custom DNS")}
            </Label>
            <Switch
              checked={settings.dns.useDNS}
              onChange={(checked: boolean) =>
                handleDNSChange("useDNS", checked)
              }
            />
          </div>
          {settings.dns.useDNS && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>
                  {t("network.dns.primary", "Primary DNS")}
                </Label>
                <Input
                  placeholder="8.8.8.8"
                  value={settings.dns.primaryDNS}
                  onChange={(e) => handleDNSChange("primaryDNS", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>
                  {t("network.dns.secondary", "Secondary DNS")}
                </Label>
                <Input
                  placeholder="8.8.4.4"
                  value={settings.dns.secondaryDNS}
                  onChange={(e) => handleDNSChange("secondaryDNS", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proxy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("network.proxy.title", "Proxy Settings")}</CardTitle>
          <CardDescription>
            {t(
              "network.proxy.description",
              "Configure proxy settings for network traffic"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>
              {t("network.proxy.enable", "Enable Proxy")}
            </Label>
            <Switch
              checked={settings.proxy.enabled}
              onChange={(checked: boolean) =>
                handleProxyChange("enabled", checked)
              }
            />
          </div>
          {settings.proxy.enabled && (
            <div className="space-y-4">
              <Select
                value={settings.proxy.type}
                onValueChange={(value: "http" | "socks") =>
                  handleProxyChange("type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("network.proxy.selectType", "Select proxy type")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">
                    {t("network.proxy.httpProxy", "HTTP Proxy")}
                  </SelectItem>
                  <SelectItem value="socks">
                    {t("network.proxy.socksProxy", "SOCKS Proxy")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-2">
                  <Label>
                    {t("network.proxy.host", "Host")}
                  </Label>
                  <Input
                    placeholder={t(
                      "network.proxy.hostPlaceholder",
                      "proxy.example.com"
                    )}
                    value={settings.proxy.host}
                    onChange={(e) => handleProxyChange("host", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>
                    {t("network.proxy.port", "Port")}
                  </Label>
                  <Input
                    placeholder="8080"
                    value={settings.proxy.port}
                    onChange={(e) => handleProxyChange("port", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>
                  {t("network.proxy.requiresAuth", "Requires Authentication")}
                </Label>
                <Switch
                  checked={settings.proxy.requiresAuth}
                  onChange={(checked: boolean) =>
                    handleProxyChange("requiresAuth", checked)
                  }
                />
              </div>

              {settings.proxy.requiresAuth && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>
                      {t("network.proxy.username", "Username")}
                    </Label>
                    <Input
                      type="text"
                      value={settings.proxy.username}
                      onChange={(e) =>
                        handleProxyChange("username", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>
                      {t("network.proxy.password", "Password")}
                    </Label>
                    <Input
                      type="password"
                      value={settings.proxy.password}
                      onChange={(e) =>
                        handleProxyChange("password", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cookie Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("network.cookies.title", "Cookie Settings")}</CardTitle>
          <CardDescription>
            {t(
              "network.cookies.description",
              "Manage cookie and tracking preferences"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>
              {t(
                "network.cookies.allowThirdParty",
                "Allow Third-Party Cookies"
              )}
            </Label>
            <Switch
              checked={settings.cookies.allowThirdParty}
              onChange={(checked: boolean) =>
                handleCookieChange("allowThirdParty", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>
              {t("network.cookies.clearOnExit", "Clear Cookies on Exit")}
            </Label>
            <Switch
              checked={settings.cookies.clearOnExit}
              onChange={(checked: boolean) =>
                handleCookieChange("clearOnExit", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>
              {t("network.cookies.blockTracking", "Block Tracking Cookies")}
            </Label>
            <Switch
              checked={settings.cookies.blockTracking}
              onChange={(checked: boolean) =>
                handleCookieChange("blockTracking", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>{t("common.save", "Save Changes")}</Button>
      </div>
    </div>
  );
}