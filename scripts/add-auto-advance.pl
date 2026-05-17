#!/usr/bin/env perl
# One-off script: wire useAutoAdvance into every brain activity component.
#
# Adds three things to each *Activity.tsx file:
#   1. The hook import (right after the useCelebration import)
#   2. A useAutoAdvance({...}) call (right before useCelebration)
#   3. A countdown indicator below the Next-round button
#
# Idempotent — re-running on a file that already has the hook leaves it alone.

use strict;
use warnings;

my $file = shift @ARGV or die "Usage: $0 <file>";
open my $fh, '<', $file or die "Can't read $file: $!";
local $/;  # slurp mode
my $content = <$fh>;
close $fh;

my $original = $content;

# 1. Add import (if not already present)
unless ($content =~ /use-auto-advance/) {
    $content =~ s|(import \{ useCelebration \} from '\@/lib/use-celebration';)|$1\nimport { useAutoAdvance } from '\@/lib/use-auto-advance';|;
}

# 2. Add hook call right before useCelebration({
unless ($content =~ /useAutoAdvance\(\{/) {
    $content =~ s|(  useCelebration\(\{)|  const autoAdvanceSecondsLeft = useAutoAdvance({\n    phase,\n    isCorrect: lastRoundData?.isCorrect ?? false,\n    onAdvance: advanceFromRoundResult,\n  });\n\n$1|;
}

# 3. Add countdown indicator below the Next-round button. Anchor on the
#    unique "How did that go?" + ChevronRight + </button> sequence.
unless ($content =~ /Auto-continues in/) {
    $content =~ s|(\{round < TOTAL_ROUNDS \? `Next round.*?: 'How did that go\?'\}\s*\n\s+<ChevronRight className="w-5 h-5" strokeWidth=\{3\} />\s*\n\s+</button>)|$1\n            {autoAdvanceSecondsLeft !== null \&\& (\n              <p className="text-[10px] text-gray-400 mt-2 text-center">\n                Auto-continues in {autoAdvanceSecondsLeft}s · tap above to skip\n              </p>\n            )}|s;
}

if ($content ne $original) {
    open my $out, '>', $file or die "Can't write $file: $!";
    print $out $content;
    close $out;
    print "Updated: $file\n";
} else {
    print "Skipped (no changes): $file\n";
}
