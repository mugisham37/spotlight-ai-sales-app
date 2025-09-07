
'use client'

import { UserButton } from '@clerk/nextjs'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { usePathname } from 'next/navigation'
import React from 'react'
import { Tooltip } from 'recharts'

type Props = {}

const Sidebar = (props : Props) => {
    const pathname = usePathname();
  return (
    <div className='w-18 sm:w-28 h-screen sticky top-0 py-10 px-2 sm:px-6 border bg-background border-border flex flex-col items-center justify-start gap-10'>
        <div>
            {/* Logo: spotlight triangle icon */}
            <img src="/assets/icons/spotlight-triangle.svg" alt="Spotlight Logo" className="w-8 h-8" />
        </div>
        <div className='w-full h-full justify-between items-center flex flex-col'>
            {
                sidebarData.map((item) => (
                    <TooltipProvider key={item.id}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={item.link} className{`flex items-centeer gap-2 cursor-pointer rounded-lg p-2 ${pathname.includes(item.link)? 'iconBackground : ''}`}>
                                <item.icon className="w-4 h-4 ${pathname.includes(item.link) ? '' : 'opacity-80' }"/>
                                </Link>
                        </Tooltip>
                        </TooltipProvider>
                )
            }
            </div>
            <UserButton/>
        </div>
    </div>
  )
}

export default Sidebar  