interface SidebarProps {
  children: React.ReactNode;
} 

function Sidebar({ children }: SidebarProps) {
  
  return (
    <div className="p-5">
      {children}
    </div>
  )
}

export default Sidebar