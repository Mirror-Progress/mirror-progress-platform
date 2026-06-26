import type { NextPage } from 'next';
import CapabilityExperiencePage from '../../components/capabilities/CapabilityExperiencePage';
import { futureReadyInfrastructureExperience } from '../../lib/capability-experiences';

const FutureReadyInfrastructurePage: NextPage = () => {
  return <CapabilityExperiencePage experience={futureReadyInfrastructureExperience} />;
};

export default FutureReadyInfrastructurePage;
