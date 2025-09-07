'use client'
import { User } from '@prisma/client'
import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {}

    const Header = (props: Props) => {
        const pathname= useRouter();
        const router = useRouter()
    return (
    <div className='w-full px-4 pt-10 sticky top-0 z-10 flex justify-between items-center flex-wrap gap-4 bg-background'>
        {pathname.includes('pipeline') ? (
            <Button className='bg-primary/10 border-border rounded-xl'
            variant = {'outline'}
            onClick={()=> router.push('/webinar')}
            >
                <Arrowleft /> Back to Webinars
            </Button>
        ): (
            <div className='px-4 py-2 flex justify-center text-bold items-center rounded-xl bg-background border border-border text-primary capitalixe'>
                {pathname.split('/')[1]}
            </div>
        )}
        <div className='flex gap-g items-center flex-wrap'></div>
        {/* <a lightenting icon inside a purpole icon/> */}
        <PurpleIcone>
            <LightningIcon />
        </PurpleIcone>
    </div>
  )
}

export default Header