// components/index.ts

import Header from './Header';
import Hero from './Hero';
import Capabilities from './Capabilities';
import Process from './Process';
import Form from './Form';
import Footer from './Footer';
import FooterBtn from './FooterBtn';
import SocialMedia from './SocialMedia';
import Office from './Office';
import Privacy from './Privacy';
import Terms from './Terms';
import Work from './Work'; // ✅ this is critical!
import AccountMenu from './AccountMenu';

export {
  Header,
  Hero,
  Capabilities,
  Process,
  Work,       // ✅ this enables `import { Work } from '../components'`
  Form,
  Footer,
  FooterBtn,
  SocialMedia,
  Office,
  Privacy,
  Terms,
  AccountMenu,
};
