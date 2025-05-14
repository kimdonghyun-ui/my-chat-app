import GlobalEffects from "@/components/GlobalEffects";
import { SideMenu } from "@/components/layout/SideMenu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <GlobalEffects />
      <div className="flex h-screen">
        <SideMenu />
        <div className="flex-1 overflow-y-auto">{children}</div> {/* ✅ flex-1줘서 컨텐츠가 남은 공간 100% */}
      </div>
    </>
  );
}
