import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { createAccount, updateAccount } from '../../../lib/accounts';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/api-errors';
import { requireAdminApiAccount } from '../../../lib/auth-guards';
import {
  addActivityEntry,
  createClientRecord,
  createProject,
  readPlatformData,
  saveActionItem,
  saveDecision,
  saveMilestone,
  saveResource,
  updateClientRecord,
  updateProject,
} from '../../../lib/platform-store';
import { applyRateLimit } from '../../../lib/rate-limit';
import type {
  ActionItemStatus,
  InviteStatus,
  MilestoneStatus,
  OwnerType,
  ProjectHealth,
  ProjectStatus,
  ResourceType,
  UserRole,
  UserStatus,
} from '../../../lib/workspace-data';

type AdminAction =
  | 'createProject'
  | 'updateProject'
  | 'saveMilestone'
  | 'saveDecision'
  | 'saveActionItem'
  | 'saveResource'
  | 'createClientUser'
  | 'updateClientAccess'
  | 'updateClientRecord';

function asString(value: unknown) {
  return `${value ?? ''}`.trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (
    !applyRateLimit(req, res, {
      bucket: 'admin-mutate',
      windowMs: 1000 * 60,
      max: 60,
      message: 'Too many admin changes in a short window. Please pause and try again.',
    })
  ) {
    return;
  }

  try {
    const account = await requireAdminApiAccount(req, res);

    if (!account) {
      return;
    }

    const action = req.body?.action as AdminAction | undefined;
    const actorLabel = account.name;

    switch (action) {
      case 'createProject': {
        const project = await createProject({
          actorLabel,
          clientId: asString(req.body?.clientId),
          projectName: asString(req.body?.projectName),
          description: asString(req.body?.description),
          status: asString(req.body?.status) as ProjectStatus,
          phase: asString(req.body?.phase),
          health: asString(req.body?.health) as ProjectHealth,
          startDate: asString(req.body?.startDate),
          targetCompletionDate: asString(req.body?.targetCompletionDate),
          internalLead: asString(req.body?.internalLead),
          primaryClientContact: asString(req.body?.primaryClientContact),
        });

        return res.status(200).json({ ok: true, projectId: project.id });
      }

      case 'updateProject': {
        const project = await updateProject({
          actorLabel,
          id: asString(req.body?.id),
          clientId: asString(req.body?.clientId),
          projectName: asString(req.body?.projectName),
          description: asString(req.body?.description),
          status: asString(req.body?.status) as ProjectStatus,
          phase: asString(req.body?.phase),
          health: asString(req.body?.health) as ProjectHealth,
          startDate: asString(req.body?.startDate),
          targetCompletionDate: asString(req.body?.targetCompletionDate),
          internalLead: asString(req.body?.internalLead),
          primaryClientContact: asString(req.body?.primaryClientContact),
          progressPercent: Number(req.body?.progressPercent ?? 0),
          nextMilestoneId: asString(req.body?.nextMilestoneId),
          internalNotes: asString(req.body?.internalNotes),
        });

        return res.status(200).json({ ok: true, projectId: project.id });
      }

      case 'saveMilestone': {
        const milestoneId = asString(req.body?.id) || crypto.randomUUID();
        const milestone = await saveMilestone({
          actorLabel,
          id: milestoneId,
          projectId: asString(req.body?.projectId),
          title: asString(req.body?.title),
          stageLabel: asString(req.body?.stageLabel),
          status: asString(req.body?.status) as MilestoneStatus,
          date: asString(req.body?.date),
          summary: asString(req.body?.summary),
          details: asString(req.body?.details),
          decisions: `${req.body?.decisions ?? ''}`
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          clientActionItems: `${req.body?.clientActionItems ?? ''}`
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          internalActionItems: `${req.body?.internalActionItems ?? ''}`
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          dueDate: asString(req.body?.dueDate),
          owner: asString(req.body?.owner),
          internalNotes: asString(req.body?.internalNotes),
          clientVisible: Boolean(req.body?.clientVisible),
          attachmentIds: `${req.body?.attachmentIds ?? ''}`
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        });

        return res.status(200).json({ ok: true, milestoneId: milestone.id });
      }

      case 'saveDecision': {
        const decisionId = asString(req.body?.id) || crypto.randomUUID();
        const decision = await saveDecision({
          actorLabel,
          id: decisionId,
          projectId: asString(req.body?.projectId),
          milestoneId: asString(req.body?.milestoneId) || undefined,
          decision: asString(req.body?.decision),
          madeBy: asString(req.body?.madeBy),
          date: asString(req.body?.date),
          notes: asString(req.body?.notes),
          clientVisible: Boolean(req.body?.clientVisible),
        });

        return res.status(200).json({ ok: true, decisionId: decision.id });
      }

      case 'saveActionItem': {
        const actionItemId = asString(req.body?.id) || crypto.randomUUID();
        const actionItem = await saveActionItem({
          actorLabel,
          id: actionItemId,
          projectId: asString(req.body?.projectId),
          relatedMilestoneId: asString(req.body?.relatedMilestoneId) || undefined,
          description: asString(req.body?.description),
          assignedTo: asString(req.body?.assignedTo),
          ownerType: asString(req.body?.ownerType) as OwnerType,
          dueDate: asString(req.body?.dueDate),
          status: asString(req.body?.status) as ActionItemStatus,
          clientVisible: Boolean(req.body?.clientVisible),
        });

        return res.status(200).json({ ok: true, actionItemId: actionItem.id });
      }

      case 'saveResource': {
        const resourceId = asString(req.body?.id) || crypto.randomUUID();
        const resource = await saveResource({
          actorLabel,
          id: resourceId,
          projectId: asString(req.body?.projectId),
          title: asString(req.body?.title),
          url: asString(req.body?.url),
          type: asString(req.body?.type) as ResourceType,
          addedAt: asString(req.body?.addedAt) || new Date().toISOString(),
          clientVisible: Boolean(req.body?.clientVisible),
        });

        return res.status(200).json({ ok: true, resourceId: resource.id });
      }

      case 'createClientUser': {
        const client = await createClientRecord({
          actorLabel,
          companyName: asString(req.body?.companyName),
          primaryContact: asString(req.body?.contactName),
          email: asString(req.body?.email),
        });

        const createdAccount = await createAccount({
          name: asString(req.body?.contactName),
          email: asString(req.body?.email),
          company: asString(req.body?.companyName),
          password: asString(req.body?.password),
          role: 'client',
          status: (asString(req.body?.status) || 'invited') as UserStatus,
          clientId: client.id,
          assignedProjectIds: `${req.body?.assignedProjectIds ?? ''}`
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          inviteStatus: (asString(req.body?.inviteStatus) ||
            'ready_to_send') as InviteStatus,
        });

        await addActivityEntry({
          actorLabel,
          projectId: undefined,
          type: 'client_access_updated',
          message: `Created client access for ${createdAccount.email}.`,
        });

        return res
          .status(200)
          .json({ ok: true, clientId: client.id, accountId: createdAccount.id });
      }

      case 'updateClientAccess': {
        const assignedProjectIds = `${req.body?.assignedProjectIds ?? ''}`
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        let resolvedClientId = asString(req.body?.clientId) || null;

        if (!resolvedClientId && assignedProjectIds.length > 0) {
          const data = await readPlatformData();
          resolvedClientId =
            data.projects.find((project) => project.id === assignedProjectIds[0])
              ?.clientId ?? null;
        }

        const updatedAccount = await updateAccount(asString(req.body?.accountId), {
          name: asString(req.body?.name),
          company: asString(req.body?.company),
          role: asString(req.body?.role) as UserRole,
          status: asString(req.body?.status) as UserStatus,
          clientId: resolvedClientId,
          assignedProjectIds,
          inviteStatus: (asString(req.body?.inviteStatus) ||
            'accepted') as InviteStatus,
        });

        await addActivityEntry({
          actorLabel,
          type: 'client_access_updated',
          message: `Updated client access for ${updatedAccount.email}.`,
        });

        return res.status(200).json({ ok: true, accountId: updatedAccount.id });
      }

      case 'updateClientRecord': {
        const client = await updateClientRecord({
          actorLabel,
          id: asString(req.body?.clientId),
          companyName: asString(req.body?.companyName),
          primaryContact: asString(req.body?.primaryContact),
          email: asString(req.body?.email),
        });

        return res.status(200).json({ ok: true, clientId: client.id });
      }

      default:
        return res.status(400).json({ error: 'Unknown admin action.' });
    }
  } catch (error) {
    return res.status(getApiErrorStatus(error)).json({
      error: getApiErrorMessage(error, 'Unable to process request.'),
    });
  }
}
