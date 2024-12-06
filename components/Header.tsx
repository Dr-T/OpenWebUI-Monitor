"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Dropdown, Modal, message } from "antd";
import type { MenuProps } from "antd";
import {
  CopyOutlined,
  LogoutOutlined,
  SettingOutlined,
  DatabaseOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import DatabaseBackup from "./DatabaseBackup";
import { APP_VERSION } from "@/lib/version";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createRoot } from "react-dom/client";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // 如果是token页面，不显示Header
  if (pathname === "/token") {
    return null;
  }

  const [apiKey, setApiKey] = useState("加载中...");
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setAccessToken(token);

    if (!token) {
      // 如果没有token，重定向到token页面
      router.push("/token");
      return;
    }

    // 验证token的有效性
    fetch("/api/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // 如果token无效，清除token并重定向
          localStorage.removeItem("access_token");
          router.push("/token");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {
        setApiKey("加载失败");
        // 发生错误时也清除token并重定向
        localStorage.removeItem("access_token");
        router.push("/token");
      });
  }, [router]);

  const handleCopyApiKey = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      message.error("未授权，请重新登录");
      return;
    }
    if (apiKey === "未设置" || apiKey === "加载失败") {
      message.error("API密钥未设置或加载失败");
      return;
    }
    navigator.clipboard.writeText(apiKey);
    message.success("API密钥已复制到剪贴板");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/token";
  };

  const checkUpdate = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      message.error("未授权，请重新登录");
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const response = await fetch(
        "https://api.github.com/repos/variantconst/openwebui-monitor/releases/latest"
      );
      const data = await response.json();
      const latestVersion = data.tag_name;

      if (!latestVersion) {
        throw new Error("获取版本号失败");
      }

      const currentVer = APP_VERSION.replace(/^v/, "");
      const latestVer = latestVersion.replace(/^v/, "");

      if (currentVer === latestVer) {
        message.success(`当前已是最新版本 v${APP_VERSION}`);
      } else {
        return new Promise((resolve) => {
          const dialog = document.createElement("div");
          document.body.appendChild(dialog);

          const DialogComponent = () => {
            const [open, setOpen] = useState(true);

            const handleClose = () => {
              setOpen(false);
              document.body.removeChild(dialog);
              resolve(null);
            };

            const handleUpdate = () => {
              window.open(
                "https://github.com/VariantConst/OpenWebUI-Monitor/releases/latest",
                "_blank"
              );
              handleClose();
            };

            return (
              <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-[calc(100%-2rem)] !max-w-[70vw] sm:max-w-[425px] rounded-lg">
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
                        <GithubOutlined className="text-base sm:text-lg text-primary" />
                      </div>
                      <DialogTitle className="text-base sm:text-lg">
                        发现新版本
                      </DialogTitle>
                    </div>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 sm:gap-4 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-muted-foreground">
                        当前版本
                      </span>
                      <span className="font-mono text-sm sm:text-base">
                        v{APP_VERSION}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-muted-foreground">
                        最新版本
                      </span>
                      <span className="font-mono text-sm sm:text-base text-primary">
                        {latestVersion}
                      </span>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                    >
                      暂不更新
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      className="h-8 sm:h-10 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      前往更新
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          };

          createRoot(dialog).render(<DialogComponent />);
        });
      }
    } catch (error) {
      message.error("检查更新失败");
      console.error("检查更新失败:", error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:text-gray-900"
          onClick={handleCopyApiKey}
        >
          <CopyOutlined className="text-base" />
          <span>复制 API KEY</span>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:text-gray-900"
          onClick={() => setIsBackupModalOpen(true)}
        >
          <DatabaseOutlined className="text-base" />
          <span>数据迁移</span>
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:text-gray-900"
          onClick={checkUpdate}
        >
          <GithubOutlined className="text-base" spin={isCheckingUpdate} />
          <span>检查更新</span>
        </div>
      ),
    },
    {
      key: "4",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:text-red-500"
          onClick={handleLogout}
        >
          <LogoutOutlined className="text-base" />
          <span>退出登录</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16">
          <div className="h-full flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent"
            >
              OpenWebUI Monitor
            </Link>

            <Dropdown
              menu={{
                items,
                className: "mt-2 !p-2 min-w-[200px]",
              }}
              trigger={["click"]}
              placement="bottomRight"
              dropdownRender={(menu) => (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 backdrop-blur-xl">
                  {menu}
                </div>
              )}
            >
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-all">
                <SettingOutlined className="text-lg text-gray-600" />
              </button>
            </Dropdown>
          </div>
        </div>
      </header>

      <DatabaseBackup
        open={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        token={accessToken || undefined}
      />
    </>
  );
}
