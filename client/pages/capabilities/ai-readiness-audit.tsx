import type { NextPage } from 'next';
import CapabilityExperiencePage from '../../components/capabilities/CapabilityExperiencePage';
import { aiReadinessAuditExperience } from '../../lib/capability-experiences';

const AiReadinessAuditPage: NextPage = () => {
  return <CapabilityExperiencePage experience={aiReadinessAuditExperience} />;
};

export default AiReadinessAuditPage;
