import React from "react";
import type { DevMeta } from "@/src/lib/content";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// Color theme display component from style-test.tsx
export interface ColorThemeDisplayProps {
  bgColors?: string[];
  textColors?: string[];
}

export const ColorThemeDisplay: React.FC<ColorThemeDisplayProps> = ({
  bgColors = ["bg-background", "bg-muted", "bg-primary", "bg-secondary", "bg-accent"],
  textColors = [
    "text-foreground",
    "text-primary",
    "text-secondary",
    "text-accent-foreground",
    "text-muted-foreground",
  ],
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6">
      {bgColors.map((bgColor) => (
        <div key={bgColor} className={`border rounded-lg shadow-sm ${bgColor}`}>
          <h3 className="px-3 pt-3 text-md font-medium block">{bgColor}</h3>
          <div className="p-3 space-y-2">
            {textColors.map((textColor) => (
              <div
                key={`${bgColor}-${textColor}`}
                className={`w-full h-8 ${textColor} flex items-center justify-center font-sm`}
              >
                {textColor}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ShadCn Theme Display - comprehensive display of themed components
export const ShadCnThemeDisplay: React.FC = () => {
  // Color swatch data for display
  const themeColors = [
    { name: "background", bg: "bg-background", text: "text-foreground" },
    { name: "foreground", bg: "bg-foreground", text: "text-background" },
    { name: "card", bg: "bg-card", text: "text-card-foreground" },
    { name: "card-foreground", bg: "bg-card-foreground", text: "text-card" },
    { name: "popover", bg: "bg-popover", text: "text-popover-foreground" },
    { name: "popover-foreground", bg: "bg-popover-foreground", text: "text-popover" },
    { name: "primary", bg: "bg-primary", text: "text-primary-foreground" },
    { name: "primary-foreground", bg: "bg-primary-foreground", text: "text-primary" },
    { name: "secondary", bg: "bg-secondary", text: "text-secondary-foreground" },
    { name: "secondary-foreground", bg: "bg-secondary-foreground", text: "text-secondary" },
    { name: "muted", bg: "bg-muted", text: "text-muted-foreground" },
    { name: "muted-foreground", bg: "bg-muted-foreground", text: "text-muted" },
    { name: "accent", bg: "bg-accent", text: "text-accent-foreground" },
    { name: "accent-foreground", bg: "bg-accent-foreground", text: "text-accent" },
    { name: "destructive", bg: "bg-destructive", text: "text-destructive-foreground" },
    { name: "border", bg: "bg-border", text: "text-foreground" },
    { name: "input", bg: "bg-input", text: "text-foreground" },
    { name: "ring", bg: "bg-ring", text: "text-foreground" },
  ];

  return (
    <div className="space-y-12">
      {/* Color Swatches Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Theme Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {themeColors.map((color) => (
            <div key={color.name} className="space-y-2">
              <div
                className={`h-16 w-full rounded-md ${color.bg} ${color.text} flex items-center justify-center border`}
              >
                {color.name}
              </div>
              <div className="text-xs text-muted-foreground text-center">{color.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Button Variants */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Button variant="default" className="w-full">
              Default/Primary Button
            </Button>
            <div className="text-xs text-muted-foreground text-center">variant="default"</div>
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Secondary Button
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              variant="outline" with secondary colors
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              Outline Button
            </Button>
            <div className="text-xs text-muted-foreground text-center">variant="outline"</div>
          </div>
          <div className="space-y-2">
            <Button
              variant="default"
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Destructive Button
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              variant="default" with destructive colors
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full">
              Ghost Button
            </Button>
            <div className="text-xs text-muted-foreground text-center">variant="ghost"</div>
          </div>
          <div className="space-y-2">
            <Button variant="link" className="w-full">
              Link Button
            </Button>
            <div className="text-xs text-muted-foreground text-center">variant="link"</div>
          </div>
        </div>
      </section>

      {/* Card Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description with muted foreground text</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the main card content area with foreground text.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Submit</Button>
            </CardFooter>
          </Card>

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Muted Card</CardTitle>
              <CardDescription>With muted background</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content in a muted card.</p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                Action
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Interactive Components */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Interactive Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dropdown Menu */}
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Dropdown Menu</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>Open Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabs */}
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Tabs</h3>
            <Tabs defaultValue="account">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="p-4 bg-muted mt-2 rounded-md">
                Account tab content
              </TabsContent>
              <TabsContent value="password" className="p-4 bg-muted mt-2 rounded-md">
                Password tab content
              </TabsContent>
              <TabsContent value="settings" className="p-4 bg-muted mt-2 rounded-md">
                Settings tab content
              </TabsContent>
            </Tabs>
          </div>

          {/* Tooltip */}
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Tooltip</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover Me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tooltip content with popover colors</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Pagination */}
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Pagination</h3>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </section>

      {/* Component Combinations */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Combined Components</h2>
        <Card>
          <CardHeader>
            <CardTitle>User Dashboard</CardTitle>
            <CardDescription>A complex UI combining multiple components</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="mb-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-primary/10">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">12,453</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/10">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Active Now</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">1,245</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-accent/10">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">$34.5k</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex justify-end gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm">
                          Export
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export dashboard data</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Refresh Data</DropdownMenuItem>
                      <DropdownMenuItem>Share Dashboard</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TabsContent>
              <TabsContent value="analytics" className="mt-4">
                <div className="p-4 bg-muted rounded-md">Analytics content would go here</div>
              </TabsContent>
              <TabsContent value="reports" className="mt-4">
                <div className="p-4 bg-muted rounded-md">Reports content would go here</div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="ghost">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

// Component to display dev pages
export const DevPagesList: React.FC<{ devPages: DevMeta[] }> = ({ devPages }) => {
  return (
    <div className="space-y-4">
      {devPages.map((page) => (
        <div key={page.slug} className="border rounded-lg p-6 shadow-sm">
          <a href={`/dev/${page.slug}`} className="hover:underline">
            <h2 className="text-xl font-semibold mb-2 text-primary">{page.title}</h2>
          </a>
          <p className="mb-4">{page.description}</p>
        </div>
      ))}
    </div>
  );
};

// Theme Color Combinations - shows realistic text/background color pairings
export const ThemeColorCombinations: React.FC = () => {
  // Define realistic text/background combinations
  const textBackgroundCombinations = [
    {
      title: "Primary Content",
      background: "bg-background",
      combinations: [
        { name: "Default", textClass: "text-foreground" },
        { name: "Primary", textClass: "text-primary" },
        { name: "Secondary", textClass: "text-secondary" },
        { name: "Muted", textClass: "text-muted-foreground" },
        { name: "Accent", textClass: "text-accent-foreground" },
      ],
    },
    {
      title: "Card Content",
      background: "bg-card",
      combinations: [
        { name: "Default", textClass: "text-card-foreground" },
        { name: "Primary", textClass: "text-primary" },
        { name: "Secondary", textClass: "text-secondary" },
        { name: "Muted", textClass: "text-muted-foreground" },
        { name: "Accent", textClass: "text-accent-foreground" },
      ],
    },
    {
      title: "Muted Content",
      background: "bg-muted",
      combinations: [
        { name: "Default", textClass: "text-foreground" },
        { name: "Primary", textClass: "text-primary" },
        { name: "Secondary", textClass: "text-secondary" },
        { name: "Muted", textClass: "text-muted-foreground" },
        { name: "Accent", textClass: "text-accent-foreground" },
      ],
    },
    {
      title: "Primary UI Elements",
      background: "bg-primary",
      combinations: [
        { name: "Default", textClass: "text-primary-foreground" },
        { name: "Foreground (not recommended)", textClass: "text-foreground" },
        { name: "Muted (not recommended)", textClass: "text-muted-foreground" },
      ],
    },
    {
      title: "Secondary UI Elements",
      background: "bg-secondary",
      combinations: [
        { name: "Default", textClass: "text-secondary-foreground" },
        { name: "Foreground (not recommended)", textClass: "text-foreground" },
        { name: "Muted (not recommended)", textClass: "text-muted-foreground" },
      ],
    },
    {
      title: "Accent UI Elements",
      background: "bg-accent",
      combinations: [
        { name: "Default", textClass: "text-accent-foreground" },
        { name: "Foreground (not recommended)", textClass: "text-foreground" },
        { name: "Muted (not recommended)", textClass: "text-muted-foreground" },
      ],
    },
    {
      title: "Destructive UI Elements",
      background: "bg-destructive",
      combinations: [{ name: "Default", textClass: "text-destructive-foreground" }],
    },
    {
      title: "Popover Content",
      background: "bg-popover",
      combinations: [
        { name: "Default", textClass: "text-popover-foreground" },
        { name: "Primary", textClass: "text-primary" },
        { name: "Secondary", textClass: "text-secondary" },
        { name: "Muted", textClass: "text-muted-foreground" },
      ],
    },
  ];

  // Sample content paragraphs
  const sampleText = {
    heading: "The quick brown fox jumps over the lazy dog",
    paragraph:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  };

  return (
    <div className="space-y-10">
      {/* Text content combinations */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Realistic Text/Background Combinations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {textBackgroundCombinations.map((combo) => (
            <div key={combo.title} className={`p-5 rounded-lg border ${combo.background}`}>
              <h3 className="text-xl font-semibold mb-3">{combo.title}</h3>
              {combo.combinations.map((textCombo) => (
                <div key={textCombo.name} className="mb-4">
                  <div className={`font-medium mb-1 ${textCombo.textClass}`}>
                    {textCombo.name}: {sampleText.heading}
                  </div>
                  <div className={`text-sm ${textCombo.textClass}`}>{sampleText.paragraph}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Realistic UI examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">UI Examples with Text Emphasis</h2>

        {/* Article/Blog Post Card */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Article/Blog Post Example</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Understanding Color Theory in UI Design
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Published on April 25, 2025 • 5 min read
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Color is one of the most powerful tools in a designer's toolkit. It can influence
                mood, direct attention, and communicate meaning.
              </p>
              <h4 className="text-primary font-medium">The Psychology of Color</h4>
              <p className="text-foreground">
                Different colors evoke different emotional responses.{" "}
                <span className="text-primary">
                  Blue is often associated with trust and stability
                </span>
                , while{" "}
                <span className="text-accent">
                  yellow tends to evoke feelings of optimism and energy
                </span>
                .
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-muted-foreground italic">
                  "Color is a power which directly influences the soul." — Wassily Kandinsky
                </p>
              </div>
              <h4 className="text-secondary font-medium">Building a Coherent Color Palette</h4>
              <p className="text-foreground">
                Creating a balanced color palette is essential for a cohesive design. The{" "}
                <span className="text-accent">60-30-10 rule</span> suggests using:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>60% primary color</li>
                <li>30% secondary color</li>
                <li>10% accent color</li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  ❤ Like
                </Button>
                <Button variant="ghost" size="sm">
                  💬 Comment
                </Button>
              </div>
              <Button variant="default" size="sm">
                Read More
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Dashboard UI */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Dashboard UI Example</h3>
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-foreground">Analytics Dashboard</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    size="sm"
                  >
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">24,531</p>
                    <p className="text-xs text-primary">+12% from last month</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">$54,237</p>
                    <p className="text-xs text-accent">+8% from last month</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">1,342</p>
                    <p className="text-xs text-destructive">-3% from last month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-card border rounded-md p-4 mb-6">
                <h3 className="text-card-foreground font-medium mb-2">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-foreground">New user signup</span>
                    <span className="text-muted-foreground text-sm">5 minutes ago</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-foreground">Purchase completed</span>
                    <span className="text-primary text-sm">10 minutes ago</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-foreground">Server error reported</span>
                    <span className="text-destructive text-sm">25 minutes ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Example */}
        <div>
          <h3 className="text-lg font-medium mb-3">Form Example</h3>
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="bg-input border rounded-md px-3 py-2 text-foreground">
                  user@example.com
                </div>
                <p className="text-xs text-muted-foreground">
                  Your email address is used for notifications.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="bg-input border rounded-md px-3 py-2 text-foreground">
                  ••••••••••••
                </div>
                <p className="text-xs text-muted-foreground">Last changed 30 days ago.</p>
              </div>

              <div className="pt-2">
                <p className="text-sm text-accent">Two-factor authentication is enabled.</p>
                <p className="text-xs text-destructive">Your security key will expire in 5 days.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 border-t pt-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
};

// ProductSelector - allows switching between product themes
export const ProductSelector: React.FC = () => {
  // Add state for product selection
  const [product, setProduct] = React.useState<string>(() => {
    // Initialize from document if available (client-side)
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-product") || "mirascope";
    }
    return "mirascope";
  });

  // Handle product change
  const handleProductChange = (newProduct: string) => {
    setProduct(newProduct);

    // Update the data-product attribute on the document
    if (typeof document !== "undefined") {
      if (newProduct === "mirascope") {
        document.documentElement.removeAttribute("data-product");
      } else {
        document.documentElement.setAttribute("data-product", newProduct);
      }
    }
  };

  return (
    <div className="fixed top-25 right-4 z-50 flex items-center space-x-2 bg-card p-2 bg-background rounded-md border shadow-sm">
      <span className="text-sm font-medium">Product:</span>
      <div className="flex space-x-2">
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            product === "mirascope"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => handleProductChange("mirascope")}
        >
          Mirascope
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            product === "lilypad"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => handleProductChange("lilypad")}
        >
          Lilypad
        </button>
      </div>
    </div>
  );
};

// Export all dev components
export const devComponents = {
  ColorThemeDisplay,
  ShadCnThemeDisplay,
  ThemeColorCombinations,
  ProductSelector,
  DevPagesList,
};
