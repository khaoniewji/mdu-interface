
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Share2, Heart, Coffee, Github } from "lucide-react";

const DonationOptions = [
  { amount: 5, description: "Buy me a coffee" },
  { amount: 10, description: "Basic support" },
  { amount: 25, description: "Advanced support" },
  { amount: 50, description: "Premium support" },
];

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative container max-w-6xl mx-auto px-4 py-16">
        <div className="space-y-16">
          {/* Header Section */}
          <div className="space-y-6 text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Support MDU Development
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              MDU helps musicians, producers, content creators, educators, and many others do what they love. 
              It's a passion project built with love, not profit in mind.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column - Mission Statement */}
            <div className="lg:col-span-2 space-y-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-zinc-300">
                  We believe that powerful audio tools should be accessible and safe. 
                  That's why MDU will always be:
                </p>
                
                <ul className="space-y-2 list-none pl-0 my-1">
                  {[
                    { icon: "🛡️", text: "Free from ads and malicious content" },
                    { icon: "🤝", text: "Built with privacy in mind" },
                    { icon: "♿", text: "Accessible to everyone" },
                    { icon: "🌟", text: "Easy to use and understand" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-zinc-900/50 backdrop-blur">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-zinc-300">{item.text}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-lg text-zinc-300 mb-8">
                  If MDU has helped your creative journey, please consider:
                </p>

                <div className="flex flex-wrap gap-4">
                  {[
                    { icon: Star, text: "Star Repository" },
                    { icon: Share2, text: "Share MDU" },
                    { icon: Heart, text: "Sponsor" }
                  ].map((item, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 backdrop-blur gap-2"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.text}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Donation Card */}
            <div>
              <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800">
                <div className="p-6">
                  <Tabs defaultValue="one-time" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
                      <TabsTrigger value="one-time" className="data-[state=active]:bg-zinc-700/50">
                        One-time
                      </TabsTrigger>
                      <TabsTrigger value="monthly" className="data-[state=active]:bg-zinc-700/50">
                        Monthly
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="one-time">
                      <CardContent className="p-0 mt-6 space-y-6">
                        <div className="space-y-1">
                          {DonationOptions.map((option) => (
                            <Button
                              key={option.amount}
                              variant="outline"
                              className="w-full h-auto py-2 flex items-center justify-between bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50"
                            >
                              <span className="text-zinc-400">{option.description}</span>
                              <span className="text-lg font-bold">${option.amount}</span>
                            </Button>
                          ))}
                        </div>
                        
                        <Button className="w-full gap-2 bg-white text-black hover:bg-white/90">
                          <Coffee className="w-4 h-4" />
                          Donate Now
                        </Button>

                        <div className="flex items-center gap-2 justify-center text-sm text-zinc-400">
                          <Github className="w-4 h-4" />
                          <span>Also available on GitHub Sponsors</span>
                        </div>
                      </CardContent>
                    </TabsContent>
                    <TabsContent value="monthly">
                      <CardContent className="p-0 mt-6">
                        <div className="text-center text-zinc-400 py-12">
                          Monthly donations coming soon!
                        </div>
                      </CardContent>
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-zinc-800 pt-8">
            <p className="text-zinc-400 text-center">
              Every form of support helps us continue improving MDU and creating more tools for the community.
              Thank you for being part of our journey! 💖
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}