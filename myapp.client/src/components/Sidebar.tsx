import { NavLink } from "react-router-dom";

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-title">
                MyApp
            </div>

            <nav>
                <NavLink to="/">
                    Dashboard
                </NavLink>

                <NavLink to="/customers">
                    Customers
                </NavLink>

                <NavLink to="/orders">
                    Orders
                </NavLink>
            </nav>
        </aside>
    );
}