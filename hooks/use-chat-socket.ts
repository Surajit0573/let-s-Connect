import { useSocket } from "@/components/providers/socket-provider";
import { Member, Message, Profile } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type ChatSocketProps = {
    addKey: string;
    updateKey: string;
    queryKey: string;
};

type MessageWithMemberWithProfile = Message & {
    member: Member & {
        profile: Profile;
    };
};

export const useChatSocket = ({ addKey, updateKey, queryKey }: ChatSocketProps) => {
    const { socket } = useSocket(); // Destructure socket from the context
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return; // Early return if socket is not available

        const handleUpdateMessage = (message: MessageWithMemberWithProfile) => {
            queryClient.setQueryData([queryKey], (oldData: any) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return oldData;
                }

                const newData = oldData.pages.map((page: any) => ({
                    ...page,
                    items: page.items.map((item: MessageWithMemberWithProfile) =>
                        item.id === message.id ? message : item
                    ),
                }));

                return { ...oldData, pages: newData };
            });
        };

        const handleAddMessage = (message: MessageWithMemberWithProfile) => {
            queryClient.setQueryData([queryKey], (oldData: any) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return { pages: [{ items: [message] }] };
                }

                const newData = [...oldData.pages];
                newData[0] = { ...newData[0], items: [message, ...newData[0].items] };

                return { ...oldData, pages: newData };
            });
        };

        socket.on(updateKey, handleUpdateMessage);
        socket.on(addKey, handleAddMessage);

        return () => {
            socket.off(updateKey, handleUpdateMessage);
            socket.off(addKey, handleAddMessage);
        };
    }, [socket, addKey, updateKey, queryKey, queryClient]);
};
