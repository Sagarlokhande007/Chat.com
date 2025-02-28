import React from "react";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./LeftSidebar";

function MainLayout() {
  return (
    <div>
      <LeftSidebar />
      {/* Yaha se CHILD components render honge */}
      <div>  
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
