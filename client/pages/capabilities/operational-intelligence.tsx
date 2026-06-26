import type { NextPage } from 'next';
import CapabilityExperiencePage from '../../components/capabilities/CapabilityExperiencePage';
import { operationalIntelligenceExperience } from '../../lib/capability-experiences';

const OperationalIntelligencePage: NextPage = () => {
  return <CapabilityExperiencePage experience={operationalIntelligenceExperience} />;
};

export default OperationalIntelligencePage;
