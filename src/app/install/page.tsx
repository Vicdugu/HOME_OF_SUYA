import type { Metadata } from "next";
import InstallAppPanel from "@/components/ui/InstallAppPanel";

export const metadata: Metadata = {
  title: "Install the Home of Suya App",
  description:
    "Add Home of Suya to your phone's home screen for quick access to ordering. Works on Android and iPhone.",
};

export default function InstallPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Install the Home of Suya app</h1>
      <p className="text-gray-600 mb-10">
        Add Home of Suya to your phone&apos;s home screen to order in just a couple of taps. It works on
        Android and iPhone, and you don&apos;t need to download anything from an app store.
      </p>
      <InstallAppPanel />
    </main>
  );
}
