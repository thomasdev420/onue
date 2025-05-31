import Link from "next/link";
import {
  Home,
  Video,
  Calendar,
  Megaphone,
  Image as ImageIcon,
  Book,
  User,
  HelpCircle,
  Settings,
  ArrowLeft,
  Sparkles,
  ImagePlus,
  Lightbulb,
  Camera,
  CreditCard,
  Pocket,
  Package,
  Upload
} from 'lucide-react';

export default function Dashboard() {
  return (
    <>
      {/* Header with Centered Welcome */}
      <div className="mb-8">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold text-gray-800">Welcome to SwiftReel</h1>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {/* Card 1 */}
        <div className="bg-white pt-4 px-4 pb-3 rounded-lg shadow-sm h-40 flex flex-col">
          <div className="mb-4">
            <Camera size={24} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Create UGC videos</h2>
            <p className="text-gray-600 text-base">Create & publish UGC videos promoting your product demo</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white pt-4 px-4 pb-3 rounded-lg shadow-sm h-40 flex flex-col">
           <div className="mb-4">
             <Sparkles size={24} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Create Greenscreen Meme videos</h2>
            <p className="text-gray-600 text-base">Create relatable meme videos about your product / business</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white pt-4 px-4 pb-3 rounded-lg shadow-sm h-40 flex flex-col">
          <div className="mb-4">
            <ImagePlus size={24} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">UGC Avatar Generator</h2>
            <p className="text-gray-600 text-base">Create custom AI avatars for the UGC</p>
          </div>
        </div>

        {/* Card 4 - Hook Generator */}
        <div className="bg-white pt-4 px-4 pb-3 rounded-lg shadow-sm h-40 flex flex-col">
          <div className="mb-4">
            <Lightbulb size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Hook Generator</h2>
            <p className="text-gray-600 text-base">Auto-magically generate and save viral hooks</p>
          </div>
        </div>
      </div>

      {/* Get Started Section */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Get Started</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-blue-100 text-blue-500">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Subscription required</h3>
                <p className="text-gray-500 text-sm">Estimated 2–3 minutes</p>
              </div>
            </div>
            <Link href="/#pricing">
               <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
                 Upgrade now
                  <span>➔</span>
                </button>
            </Link>

          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-gray-100 text-gray-700">
                <Pocket size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Connect TikTok account</h3>
                <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
              </div>
            </div>
            <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
              Connect TikTok
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-gray-100 text-gray-700">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Add your first product</h3>
                <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
              </div>
            </div>
            <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
              Add Product
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-blue-100 text-blue-500">
                <Upload size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Upload product demo video</h3>
                <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
              </div>
            </div>
            <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
              Upload Demo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}