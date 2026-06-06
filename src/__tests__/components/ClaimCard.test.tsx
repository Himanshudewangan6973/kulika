import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClaimCard from '@/components/claims/ClaimCard';
import type { ClaimWithEvidence } from '@/types/kulika';

describe('ClaimCard Component', () => {
  const mockClaim: ClaimWithEvidence = {
    id: '123',
    familyId: 'fam-1',
    subjectId: 'member-1',
    claimType: 'birth_date',
    claimValue: '1950-01-01',
    claimedBy: 'user-1',
    claimedAt: '2024-01-01T00:00:00Z',
    confidenceScore: 0.95,
    sourceType: 'certificate',
    sourceDescription: 'Birth certificate from municipal office',
    status: 'proposed',
    isCurrent: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    evidence: [
      {
        id: 'ev-1',
        claimId: '123',
        evidenceType: 'document',
        title: 'Birth Certificate',
        fileUrl: 'https://example.com/cert.pdf',
        fileSizeMb: 2.5,
        uploadedBy: 'user-1',
        uploadedAt: '2024-01-01T00:00:00Z',
        trustScore: 0.98,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ],
    conflictingClaims: [],
  };

  it('should render claim information', () => {
    render(
      <ClaimCard
        claim={mockClaim}
        canApprove={false}
      />
    );

    expect(screen.getByText('birth_date')).toBeInTheDocument();
    expect(screen.getByText('1950-01-01')).toBeInTheDocument();
  });

  it('should expand/collapse on button click', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ClaimCard claim={mockClaim} canApprove={false} />
    );

    const expandButton = container.querySelector('button');
    await user.click(expandButton!);

    expect(screen.getByText('Birth Certificate')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('should call onApprove when approve button clicked', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();

    const { container } = render(
      <ClaimCard
        claim={mockClaim}
        onApprove={onApprove}
        canApprove={true}
      />
    );

    // Expand card
    const expandButton = container.querySelector('button');
    await user.click(expandButton!);

    // Click approve
    const approveButton = screen.getByRole('button', { name: /approve/i });
    await user.click(approveButton);

    expect(onApprove).toHaveBeenCalled();
  });

  it('should show confidence indicator', () => {
    render(
      <ClaimCard claim={mockClaim} canApprove={false} />
    );

    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should display different status colors', () => {
    const { container: approvedContainer } = render(
      <ClaimCard
        claim={{ ...mockClaim, status: 'approved' }}
        canApprove={false}
      />
    );

    expect(approvedContainer.querySelector('.bg-green-50')).toBeInTheDocument();
  });

  it('should show conflicting claims section', () => {
    const claimWithConflict: ClaimWithEvidence = {
      ...mockClaim,
      conflictingClaims: [
        {
          ...mockClaim,
          id: '456',
          claimValue: '1950-02-01',
          confidenceScore: 0.60,
        },
      ],
    };

    const { container } = render(
      <ClaimCard claim={claimWithConflict} canApprove={false} />
    );

    const expandButton = container.querySelector('button');
    fireEvent.click(expandButton!);

    expect(screen.getByText(/Conflicting Claims/i)).toBeInTheDocument();
  });
});
