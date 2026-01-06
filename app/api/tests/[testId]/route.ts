import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/roles';

// DELETE /api/tests/[testId] - Delete a test (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    
    // Check if user is admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createServerClient();

    // Delete related questions first (cascade delete)
    const { error: questionsError } = await supabase
      .from('questions')
      .delete()
      .eq('test_id', testId);

    if (questionsError) {
      console.error('Error deleting questions:', questionsError);
      // Continue even if questions deletion fails
    }

    // Delete related attempts (cascade delete)
    const { error: attemptsError } = await supabase
      .from('attempts')
      .delete()
      .eq('test_id', testId);

    if (attemptsError) {
      console.error('Error deleting attempts:', attemptsError);
      // Continue even if attempts deletion fails
    }

    // Delete the test
    const { error: testError } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId);

    if (testError) {
      console.error('Error deleting test:', testError);
      return NextResponse.json(
        { error: 'Failed to delete test' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    );
  }
}

