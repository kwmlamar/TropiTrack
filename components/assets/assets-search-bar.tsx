"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

/**
 * Assets Search Bar Component
 * 
 * Search bar that appears directly below the site header on mobile.
 * Designed to be integrated into the page layout below the header.
 */
export function AssetsSearchBar() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search assets…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 h-12 text-base bg-gray-50 border-gray-200 focus:bg-white focus:border-[#2596be] rounded-lg"
        />
      </div>
    </div>
  )
}

