import React from "react";
import {
  Home,
  Search,
  TrendingUp,
  MessageCircle,
  Heart,
  PlusSquare,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const sidebarItems = [
  { icon: <Home />, text: "Home" },
  { icon: <Search />, text: "Search" },
  { icon: <TrendingUp />, text: "Explore" },
  { icon: <MessageCircle />, text: "Messages" },
  { icon: <Heart />, text: "Notifications" },
  { icon: <PlusSquare />, text: "Create" },
  {
    icon: (
      <Avatar className="w-6 h-6">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    ),
    text: "Profile",
  },
  { icon: <LogOut />, text: "Logout" },
];

const LeftSidebar = () => {
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/user/logout", {
        withCredentials: true,
      });
      if (res.data.success) {
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const sidebarHandler = (textType) =>{
    if (textType === "Logout") {
      logoutHandler();
    } else {
      navigate(`/${textType.toLowerCase()}`);
    }
  }
  return (
    <div className="flex top-0 left-0 z-10 flex-col items-center justify-between w-16 h-screen bg-gray-800 text-white">
      <div className="flex flex-col items-center mt-8">
      <h1 className="my-8 pl-3 font-bold text-xl">LOGO</h1>
        {sidebarItems.map((item, index) => (
          <div
            onClick={() => sidebarHandler(item.text)}
            key={index}
            className="flex flex-col items-center justify-center w-12 h-12 my-4 cursor-pointer"
          >
            {item.icon}
            <span className="text-xs">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftSidebar;
