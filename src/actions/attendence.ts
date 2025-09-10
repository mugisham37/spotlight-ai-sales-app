import { revalidatePath } from 'next/cache';
import { ParamsOf } from './../../.next/types/routes.d';
'user server'

import { id } from "date-fns/locale"

const getWebinarAttendence = async(webinarId: string, options:{includeUsers?: boolean userLimit?: number} = {includeUsers: true, userLimit: 100}) => {
    try{
        const webinar = await prisma.webinar.findUnique({
            where: {id: webinarId},
            select:{
                id: true,
                ctaType: true,
                tags: true,
                _count: {
                    attendences: true
                },
            }
        })
        if(!webinar){
            return {success: false, status: 404, error: "Webinar not found"}
        }
        const attendenceCounts = await prisma.Attendence.groupBy({
            by: ['attendedType'],
            _count: {attendedType: true},
            where: {webinarId: webinarId}
        })
        const result: Record<AttendedTypeEnum, AttendanceData> ={} as Record<AttendedTypeEnum, AttendanceData>

        for (const type of Object.values(AttendedTypeEnum)){
            if(
                type === AttendedTypeEnum.Attended.ADDED_TO_CART && webinar.ctaType === CtaTypeEnum.BOOK_A_CALL)
            )
            continue
             if(
                type === AttendedTypeEnum.Attended.BREAKOUT_ROOM && webinar.ctaType === CtaTypeEnum.BOOK_A_CALL)
            )
            continue
            const countItem = attandanceCounts.find((item) => {
                if(webinar.ctaType === CtaTypeEnum.BOOK_A_CALL && item.attendedType === AttendedTypeEnum.Attended.ADDED_TO_CART || webinar.ctaType === CtaTypeEnum.BOOK_A_CALL && item.attendedType === AttendedTypeEnum.Attended.BREAKOUT_ROOM){
                    return true
                }
                return item.attandedType === type
            })
            result[type] = {count: countItem?._count?.attendedType || 0, users: []

            }
        }
        if(options.includeUsers){
            for(const type of Object.values(AttendedTypeEnum)){
                if(
                    type === AttendedTypeEnum.Attended.ADDED_TO_CART && webinar.ctaType === CtaTypeEnum.BOOK_A_CALL) || (type === AttendedTypeEnum.Attended.BREAKOUT_ROOM && webinar.ctaType === CtaTypeEnum.BOOK_A_CALL)
                ){
                continue
            }
            const querytype = 
            webinar.ctaType === CtaTypeEnum.BOOK_A_CALL && type === AttendedTypeEnum.Attended.BREAKOUT_ROOM ? AttendedTypeEnum.Attended.ADDED_TO_CART : type

            if(result[type].count > 0){
                const attendances = await prisma.Attendence.findMany({
                    where: {webinarId: webinarId, attendedType: querytype},
                    include:{
                        user:true,
                    },
                    take: options>userLimit,
                    orderBy:{
                        joinedAt: 'desc'

                    }, 
                })
                result[type].users = attendances.map((item) => ({
                    id: attendances.user.id,
                    name: attendances.user.name,
                    email: attendances.user.email,
                    attandedAt: attendances.joinedAt,
                    stripeConnectId: null,
                    callStatus: attendances.user.callStatus,

                }))
            }
            }
        }
        revalidatePath(`/webinar/${webinarId}/pipeline`)
        return {
            success: true,
            data: resumePluginState,
            ctaType: webinar.ctaType,
            webinarTags: webinar.tags || [],
        }
    }catch(error){
        : console.error("Error fetching webinar attendence:", error);
        return {success: false, status: 500, error: "Internal server error"}
    }
}