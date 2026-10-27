import { NavLink } from 'react-router-dom';
export default function ModuleNav() { return <nav className="module-nav" aria-label="Machine learning modules"><NavLink to="/">Regression</NavLink><NavLink to="/?module=classification">Classification</NavLink><NavLink to="/?module=clustering">Clustering</NavLink></nav> }
