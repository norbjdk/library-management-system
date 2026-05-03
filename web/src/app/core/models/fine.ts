export interface Fine {
    id: number;
    user: number;
    loan: number;
    amount: string;
    issue_date: string;
    paid: boolean;
    paid_date: string | null;
}
