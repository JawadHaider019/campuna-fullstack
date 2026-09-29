import { redirect } from 'next/navigation';

export default function FehltDirEtwasRedirect() {
    redirect('/kontakt?thema=feature');
}
