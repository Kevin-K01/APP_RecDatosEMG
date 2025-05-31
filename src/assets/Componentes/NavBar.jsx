import { Link } from 'react-router-dom'


const links = [
{
    name: "Home",
    href: "/"
},
{
    name: "Ejercicios",
    href: "/Graficas"
},
{
    name: "Dashboard",
    href: "/Dashboard"
},
]

const NavBar = () => {
  return (
    <>
        <nav className="navbar">
            <img src="/myobrazaleteblnc.png" className='imgmyoprincipal'/>
            <a href='/' className ='inicio'><p className='titulo'>MYOREHABY</p></a>
            <div className='secciones'>{links.map((x,i)=>(<div className='links' key ={i}><Link to ={x.href}>{x.name}</Link></div>))}</div>
            
        </nav>
        <div  className='head'></div>
    </>
        

  )
}

export default NavBar
