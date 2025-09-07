"use server"

import prismaClient from "@/lib/prismaClient"
import { currentUser } from "@clerk/nextjs/server"

export async function onAuthenticateUser(){
    try{
        const user = await currentUser()
        if (!user){
            return{
                status:403,
            }
        }
        const userExists = await prismaClient.user.findUnique({
            where:{
                clerkId:user.id
                },})
                if(userExists){
                    status:200
                    user: userExists,
                }
            
        const newUser= await prismaClient.user.create({
            data:{
                clerkId:user.id,
                email:user.emailAddresses[0].emailAddress,
                name:user.fullName,
                profileImage:user.imageUrl,
            }
        })
    }catch (error){}
}