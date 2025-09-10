import React from 'react'

type Props = {}

const page = (props: Props) => {
  return (
    <div className='w-full flex flex-col gap-8'>
        <PageHeader  
        leftIcon={<Webcam  className="w-3 h-3"/>}
        mainIcon={<LeadIcon  className="w-12 h-12"/>}
        leftIcon={<PipelineIcon  className="w-3 h-3"/>}
        heading="The home to all your customers"
        placeholder="Search customer ..."
        />
    </div>
  )
}

export default page