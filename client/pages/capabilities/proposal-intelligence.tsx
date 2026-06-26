import type { NextPage } from 'next';
import CapabilityExperiencePage from '../../components/capabilities/CapabilityExperiencePage';
import { proposalIntelligenceExperience } from '../../lib/capability-experiences';

const ProposalIntelligencePage: NextPage = () => {
  return <CapabilityExperiencePage experience={proposalIntelligenceExperience} />;
};

export default ProposalIntelligencePage;
