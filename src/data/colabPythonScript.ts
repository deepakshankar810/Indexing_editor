export const COLAB_PYTHON_SCRIPT = `# Clarivate Geneseq Auto-Indexer Workspace (Google Colab Edition)
# ================================================================================
# Synchronized with Clarivate Rules & Thesaurus Engine:
# - Instant Zero-Lag Client-Side DE 72-Character Counter (<72 chars valid, >72 warning)
# - Preferred Term Replacement & USE ALSO Automatic Keyword Expansion
# - Retain Original Term for Gene & Protein Targets in Col 8 (SS) ONLY
# - General Descriptors Linked to Column 9 (Technology Focus)
# - Multi-line Organism formatting with Clarivate dollar delimiter and semicolon compliance
# - 60,000+ Term Fast Excel/Workbook Thesaurus Parser (.xlsx / .xlsm)
# - Clarivate Standard 20-Column Interactive Sequence Grid with CSV Import/Export
#
# NOTE: Requires Google Colab runtime set to 'Python 3'
# (Menu: Runtime -> Change runtime type -> Python 3)
# ================================================================================

import sys
import subprocess

# Auto-install dependencies if not already present in environment
for package_name in ["gradio", "pandas", "openpyxl"]:
    try:
        __import__(package_name)
    except ImportError:
        print(f"Installing required package: {package_name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name, "-q"])

import gradio as gr
import pandas as pd
import tempfile
import re
import os

# ==============================================================================
# 1. CLARIVATE EXACT 20-COLUMN STANDARD SPECIFICATION
# ==============================================================================
COLUMNS = [
    "Sequence", "Sequence Status", "Sequence Type", "Molecule Type", "Sequence Location Type", 
    "Sequence Location", "Disease Keywords", "Sequence Specific Keywords", "Technology Focus Keywords", 
    "DE Line", "Comments", "Organism Name", "Organism Type", "Internal Cross References", 
    "External Cross References", "Feature Key", "Feature Start", "Feature Stop", 
    "Feature Qualifier", "Feature Location"
]

# ==============================================================================
# 2. IN-MEMORY SEED THESAURUS (CANONICAL CLARIVATE RULES)
# ==============================================================================
INITIAL_TERM_MAP = {}

def add_default_terms(term_list, category):
    for item in term_list:
        activity = ""
        term = item
        if "/" in item:
            parts = item.split("/")
            term = parts[0].strip()
            activity = parts[1].strip()
            
        term_lower = term.lower()
        if term_lower not in INITIAL_TERM_MAP:
            INITIAL_TERM_MAP[term_lower] = {
                "original": term,
                "preferred": "",
                "useAlso": [],
                "activity": activity,
                "categories": {category} 
            }
        else:
            INITIAL_TERM_MAP[term_lower]["categories"].add(category)
            if activity and not INITIAL_TERM_MAP[term_lower]["activity"]:
                INITIAL_TERM_MAP[term_lower]["activity"] = activity

# Technology Focus Terms (Col 9)
add_default_terms([
    "Agriculture", "Antibody engineering", "Cell culture", "CRISPR", "Genome editing", 
    "Transformation", "Vaccine", "heavy chain variable region", "light chain variable region", 
    "antibody", "humanized antibody", "monoclonal antibody", "heavy chain", "light chain", 
    "gene fusion", "fusion protein", "chimeric protein", "plant", "coding sequence", "gene", 
    "genome", "recombinant expression", "vector", "plasmid", "promoter", "enhancer",
    "expression cassette", "therapeutic", "protein engineering", "cell therapy"
], "Tech")

# Disease Keywords (Col 7)
add_default_terms([
    "cancer /cytostatic", "ovarian cancer /cytostatic", "breast cancer /cytostatic", 
    "lung cancer /cytostatic", "colorectal cancer /cytostatic", "prostate cancer /cytostatic",
    "melanoma /cytostatic", "autoimmune disease /immunosuppressive", 
    "infectious disease /antimicrobial-gen.", "metastasis", "osteosarcoma /osteopathic",
    "leukemia /cytostatic", "lymphoma /cytostatic", "inflammation /antiinflammatory",
    "diabetes /antidiabetic", "cardiovascular disease", "neurodegenerative disease",
    "Alzheimer disease", "Parkinson disease", "pain /analgesic",
    "viral infection /antiviral", "bacterial infection /antibacterial"
], "Disease")

# Sequence Specific Keywords (Col 8)
add_default_terms([
    "PCR", "RT-PCR", "miRNA", "siRNA", "ds", "ss", "aptamer", "Variable region", "CD178",
    "primer", "probe", "cDNA", "signal peptide", "epitope", "epitope tag", "his-tag",
    "linker", "restriction site", "untranslated region", "polyadenylation signal"
], "SS")

# Gene Symbols (Col 8)
add_default_terms([
    "FASL", "CD24", "PDCD1", "CD274", "EGFR", "HER2", "TP53", "VEGFA", "KRAS", "TNF", "IL6",
    "CXCL8", "ACTB", "GAPDH"
], "Gene")

# Protein Targets (Col 8)
add_default_terms([
    "Fas ligand", "PD-1", "PD-L1", "epidermal growth factor receptor", "HER2 receptor",
    "p53 tumor suppressor", "vascular endothelial growth factor A", "tumor necrosis factor",
    "interleukin-6"
], "Protein")

# General Descriptors (Linked to Col 9 - Technology Focus)
add_default_terms([
    "synthetic construct", "consensus sequence", "optimized sequence", "mutant", "variant"
], "Uncategorised")

# Canonical Seed Preferred Terms and "USE ALSO" Mappings
SEED_MAPPINGS = {
    "fasl": {"preferred": "FASLG", "useAlso": ["CD95L", "TNFSF6"]},
    "pdcd1": {"preferred": "PDCD1", "useAlso": ["CD279"]},
    "cd274": {"preferred": "CD274", "useAlso": ["PD-L1", "B7-H1"]},
    "her2": {"preferred": "ERBB2", "useAlso": ["HER2/neu"]},
    "pd-1": {"preferred": "PD-1", "useAlso": ["CD279"]},
    "humanized antibody": {"useAlso": ["monoclonal antibody"]},
    "heavy chain variable region": {"preferred": "VH region", "useAlso": ["heavy chain"]},
    "light chain variable region": {"preferred": "VL region", "useAlso": ["light chain"]}
}

for k, mapping in SEED_MAPPINGS.items():
    if k in INITIAL_TERM_MAP:
        if "preferred" in mapping:
            INITIAL_TERM_MAP[k]["preferred"] = mapping["preferred"]
        if "useAlso" in mapping:
            INITIAL_TERM_MAP[k]["useAlso"] = mapping["useAlso"]


def get_file_path(file_obj):
    if file_obj is None:
        return None
    if isinstance(file_obj, str):
        return file_obj
    if hasattr(file_obj, 'path') and file_obj.path:
        return str(file_obj.path)
    if hasattr(file_obj, 'name') and file_obj.name:
        return str(file_obj.name)
    if isinstance(file_obj, dict):
        return file_obj.get('path') or file_obj.get('name')
    return str(file_obj)

def get_original_filename(file_obj):
    if file_obj is None:
        return "file"
    if hasattr(file_obj, 'orig_name') and file_obj.orig_name:
        return str(file_obj.orig_name)
    path = get_file_path(file_obj)
    return os.path.basename(path) if path else "file"


# ==============================================================================
# 3. HIGH-THROUGHPUT THESAURUS PARSER (SCALES TO 100,000+ TERMS)
# ==============================================================================
def process_thesaurus(file_obj, current_map):
    if file_obj is None:
        return [gr.update()] * 6 + [current_map, "⚠️ Please upload or drop a thesaurus workbook first."]

    file_path = get_file_path(file_obj)
    if not file_path or not os.path.exists(file_path):
        return [gr.update()] * 6 + [current_map, "⚠️ Could not locate uploaded thesaurus file on disk."]

    orig_name = get_original_filename(file_obj)
    ext = os.path.splitext(orig_name)[1].lower()

    xls = {}
    try:
        if ext == '.csv':
            df_csv = pd.read_csv(file_path)
            xls = {"Thesaurus": df_csv}
        elif ext == '.xls':
            try:
                xls = pd.read_excel(file_path, sheet_name=None)
            except Exception:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "xlrd", "-q"])
                xls = pd.read_excel(file_path, sheet_name=None, engine='xlrd')
        else:
            try:
                xls = pd.read_excel(file_path, sheet_name=None, engine='openpyxl')
            except Exception:
                xls = pd.read_excel(file_path, sheet_name=None)
    except Exception as e:
        return [gr.update()] * 6 + [current_map, f"❌ Error reading workbook '{orig_name}': {e}"]
    
    term_map = current_map.copy() if current_map else {}
    dropdown_sets = {
        "Disease": set(), "Tech": set(), "SS": set(),
        "Gene": set(), "Protein": set(), "Uncategorised": set()
    }
    
    # Pre-populate dropdown sets with existing seed terms
    for k, v in term_map.items():
        for c in v.get('categories', []):
            if c in dropdown_sets and v.get('original'):
                dropdown_sets[c].add(v['original'])

    counts_by_cat = {"Disease": 0, "Tech": 0, "SS": 0, "Gene": 0, "Protein": 0, "Uncategorised": 0}

    for sheet_name, df in xls.items():
        if df is None or df.empty:
            continue
        
        # Check columns
        df_cols_lower = [str(c).strip().lower() for c in df.columns]
        
        # Check for row-level category column
        cat_col = next((orig_c for orig_c, low_c in zip(df.columns, df_cols_lower) if any(k in low_c for k in ['category', 'domain', 'cat', 'field', 'class', 'sheet'])), None)
        
        # Sheet-level default category
        sn = str(sheet_name).lower()
        default_cat = "SS"
        if any(k in sn for k in ['disease', 'activity', 'indication', 'dis']):
            default_cat = "Disease"
        elif any(k in sn for k in ['tech', 'technology', 'focus']):
            default_cat = "Tech"
        elif any(k in sn for k in ['gene', 'symbol']):
            default_cat = "Gene"
        elif any(k in sn for k in ['protein', 'target']):
            default_cat = "Protein"
        elif any(k in sn for k in ['uncat', 'general', 'descriptor']):
            default_cat = "Uncategorised"
        elif any(k in sn for k in ['ss', 'sequence', 'specific']):
            default_cat = "SS"

        # Find key columns
        term_col = next((orig_c for orig_c, low_c in zip(df.columns, df_cols_lower) if any(k in low_c for k in ['term', 'keyword', 'name', 'descriptor', 'entry'])), None)
        if not term_col and len(df.columns) > 0:
            term_col = df.columns[0]
            
        pref_term_col = next((orig_c for orig_c, low_c in zip(df.columns, df_cols_lower) if any(p in low_c for p in ['preferred', 'pref', 'use preferred', 'prefer', 'use term', 'use']) and 'also' not in low_c), None)
        use_also_col = next((orig_c for orig_c, low_c in zip(df.columns, df_cols_lower) if any(u in low_c for u in ['use also', 'use_also', 'see also', 'see_also', 'usealso', 'also'])), None)
        activity_col = next((orig_c for orig_c, low_c in zip(df.columns, df_cols_lower) if any(a in low_c for a in ['activity', 'action', 'qualifier'])), None)

        if term_col:
            for _, row in df.iterrows():
                orig_term = str(row[term_col]).strip() if pd.notna(row[term_col]) else ""
                if not orig_term or orig_term.lower() == 'nan':
                    continue
                
                # Determine category
                cat = default_cat
                if cat_col and pd.notna(row[cat_col]):
                    row_cat_str = str(row[cat_col]).strip().lower()
                    if any(k in row_cat_str for k in ['disease', 'activity', 'indication', 'dis']):
                        cat = "Disease"
                    elif any(k in row_cat_str for k in ['tech', 'technology', 'focus']):
                        cat = "Tech"
                    elif any(k in row_cat_str for k in ['gene', 'symbol']):
                        cat = "Gene"
                    elif any(k in row_cat_str for k in ['protein', 'target']):
                        cat = "Protein"
                    elif any(k in row_cat_str for k in ['uncat', 'general', 'descriptor']):
                        cat = "Uncategorised"
                    elif any(k in row_cat_str for k in ['ss', 'sequence', 'specific']):
                        cat = "SS"

                pref_term = ""
                if pref_term_col and pd.notna(row[pref_term_col]):
                    pt = str(row[pref_term_col]).strip()
                    if pt and pt.lower() != 'nan':
                        pref_term = pt
                
                # Extract USE ALSO terms
                use_also_list = []
                if use_also_col and pd.notna(row[use_also_col]):
                    ua_raw = str(row[use_also_col]).strip()
                    if ua_raw and ua_raw.lower() != 'nan':
                        use_also_list = [p.strip() for p in re.split(r'[,;|\\r\\n]+', ua_raw) if p.strip() and p.strip().lower() != 'nan']
                
                activity = ""
                if activity_col and pd.notna(row[activity_col]):
                    act = str(row[activity_col]).strip()
                    if act and act.lower() != 'nan':
                        activity = act
                
                orig_lower = orig_term.lower()
                if orig_lower not in term_map:
                    term_map[orig_lower] = {
                        "original": orig_term,
                        "preferred": pref_term,
                        "useAlso": use_also_list,
                        "activity": activity,
                        "categories": {cat}
                    }
                else:
                    if pref_term: term_map[orig_lower]['preferred'] = pref_term
                    if use_also_list:
                        existing_ua = term_map[orig_lower].get('useAlso', [])
                        term_map[orig_lower]['useAlso'] = list(dict.fromkeys(existing_ua + use_also_list))
                    if activity: term_map[orig_lower]['activity'] = activity
                    term_map[orig_lower]['categories'].add(cat)
                
                if pref_term:
                    pref_lower = pref_term.lower()
                    if pref_lower not in term_map:
                        term_map[pref_lower] = {
                            "original": pref_term,
                            "preferred": "", 
                            "useAlso": [],
                            "activity": activity,
                            "categories": {cat}
                        }
                    else:
                        term_map[pref_lower]['categories'].add(cat)
                
                counts_by_cat[cat] += 1
                dropdown_sets[cat].add(orig_term)
                if pref_term:
                    dropdown_sets[cat].add(pref_term)

    summary_msg = (
        f"✅ **Synchronized {len(term_map):,} terms from '{orig_name}'**\\n\\n"
        f"&bull; **Disease (Col 7)**: {counts_by_cat['Disease']:,} terms &nbsp;|&nbsp; "
        f"**Tech Focus (Col 9)**: {counts_by_cat['Tech']:,} terms\\n\\n"
        f"&bull; **Sequence Specific (Col 8)**: {counts_by_cat['SS']:,} terms &nbsp;|&nbsp; "
        f"**Gene Symbols (Col 8)**: {counts_by_cat['Gene']:,} terms &nbsp;|&nbsp; "
        f"**Protein Targets (Col 8)**: {counts_by_cat['Protein']:,} terms"
    )

    return (
        gr.update(choices=sorted(list(dropdown_sets["Disease"]))),
        gr.update(choices=sorted(list(dropdown_sets["Tech"]))),
        gr.update(choices=sorted(list(dropdown_sets["SS"]))),
        gr.update(choices=sorted(list(dropdown_sets["Gene"]))),
        gr.update(choices=sorted(list(dropdown_sets["Protein"]))),
        gr.update(choices=sorted(list(dropdown_sets["Uncategorised"]))),
        term_map,
        summary_msg
    )


# ==============================================================================
# 4. RESOLVER & BULK EDIT LOGIC (SYNCHRONIZED WITH CLARIVATE RULES)
# ==============================================================================
def resolve_keywords(kw_list, target_column, term_map, keep_original_gene_protein=True, include_disease_activity=True, gene_protein_terms=None):
    """
    Clarivate Keyword Resolver Rules:
    1. Preferred Term Replacement: Replaces non-preferred term with preferred term.
    2. USE ALSO Expansion: Automatically appends associated USE ALSO terms.
    3. Gene & Protein Target Retention: In Col 8 (SS), if keep_original_gene_protein is True,
       both [preferred, original] are retained.
    4. General Descriptors: Routed into Col 9 (Technology Focus Keywords).
    5. Non-controlled terms are flagged with '@' prefix.
    """
    if not kw_list: 
        return []
        
    if gene_protein_terms is None:
        gene_protein_terms = set()
    
    resolved_list = []
    allowed_categories = []
    if target_column == "Disease": 
        allowed_categories = ["Disease"]
    elif target_column == "Tech": 
        allowed_categories = ["Tech", "Uncategorised"]
    elif target_column == "SS": 
        allowed_categories = ["SS", "Gene", "Protein"]
    
    for kw in kw_list:
        kw_clean = str(kw).strip()
        if not kw_clean:
            continue
        is_forced_custom = kw_clean.startswith('@')
        kw_lower = kw_clean.lstrip('@').split('/')[0].strip().lower()
        
        # Term not in dictionary -> treat as custom term with '@'
        if kw_lower not in term_map:
            clean_token = kw_clean
            inline_act = ""
            if '/' in clean_token:
                parts = clean_token.split('/', 1)
                clean_token = parts[0].strip()
                inline_act = parts[1].strip()
                
            if target_column == "Disease":
                formatted_token = clean_token if is_forced_custom else '@' + clean_token
                if include_disease_activity and inline_act:
                    resolved_list.append(f"{formatted_token} /{inline_act}")
                else:
                    resolved_list.append(formatted_token)
            else:
                resolved_list.append(kw_clean if is_forced_custom else '@' + kw_clean)
            continue
            
        data = term_map[kw_lower]
        pref = data.get('preferred', '').strip()
        use_also = data.get('useAlso', [])
        act = data.get('activity', '').strip()
        orig = data.get('original', kw_clean).strip()
        cats = data.get('categories', set())
        
        has_valid_category = any(c in allowed_categories for c in cats)
        needs_at = (not has_valid_category) or is_forced_custom
        
        primary_term = pref if pref else orig
        original_term = orig
        
        if needs_at:
            if not primary_term.startswith('@'): primary_term = '@' + primary_term
            if not original_term.startswith('@'): original_term = '@' + original_term
        
        # 1. Output primary / preferred term
        if target_column == "Disease":
            clean_act = act.lstrip('/').strip()
            if '/' in kw_clean:
                clean_act = kw_clean.split('/', 1)[1].strip()
                
            if include_disease_activity and clean_act:
                resolved_list.append(f"{primary_term} /{clean_act}")
            else:
                resolved_list.append(primary_term)
        else:
            resolved_list.append(primary_term)
            
        # 2. Retain original term along with preferred ONLY for Gene & Protein targets in Col 8 (SS)
        is_gene_or_protein = any(c.lower() in ['gene', 'protein'] for c in cats) or (kw_lower in gene_protein_terms)
        if target_column == "SS" and is_gene_or_protein and pref and keep_original_gene_protein:
            if original_term.lower() != primary_term.lower():
                resolved_list.append(original_term)
                
        # 3. USE ALSO terms: Include alongside the selected term
        if use_also and isinstance(use_also, list):
            for ua in use_also:
                ua_clean = str(ua).strip()
                if not ua_clean:
                    continue
                ua_lower = ua_clean.lstrip('@').split('/')[0].strip().lower()
                
                if ua_lower in term_map:
                    ua_data = term_map[ua_lower]
                    ua_pref = ua_data.get('preferred', '').strip()
                    ua_orig = ua_data.get('original', ua_clean).strip()
                    ua_cats = ua_data.get('categories', set())
                    ua_valid = any(c in allowed_categories for c in ua_cats)
                    
                    ua_resolved = ua_pref if ua_pref else ua_orig
                    if (not ua_valid) or is_forced_custom:
                        if not ua_resolved.startswith('@'):
                            ua_resolved = '@' + ua_resolved
                            
                    if target_column == "Disease":
                        ua_act = ua_data.get('activity', '').lstrip('/').strip()
                        if include_disease_activity and ua_act and '/' not in ua_resolved:
                            ua_resolved = f"{ua_resolved} /{ua_act}"
                        elif not include_disease_activity and '/' in ua_resolved:
                            ua_resolved = ua_resolved.split('/')[0].strip()
                            
                    resolved_list.append(ua_resolved)
                else:
                    # Custom USE ALSO term
                    if not ua_clean.startswith('@'):
                        ua_clean = '@' + ua_clean
                    resolved_list.append(ua_clean)
                
    return list(dict.fromkeys(resolved_list))


def parse_sequence_ids(input_str, max_limit=100000):
    if not input_str or str(input_str).strip().lower() == 'all':
        return 'ALL'
    seq_ids = set()
    parts = str(input_str).split(',')
    for part in parts:
        clean = re.sub(r'(?i)seq\\s*id\\s*no:?', '', part).replace('Seq', '').replace('seq', '').strip()
        if not clean:
            continue
        if '-' in clean:
            try:
                start, end = map(int, clean.split('-'))
                low = min(start, end)
                high = max(start, end)
                seq_ids.update(range(max(1, low), min(high + 1, max_limit)))
            except ValueError: 
                pass
        else:
            try:
                val = int(clean)
                if val > 0:
                    seq_ids.add(val)
            except ValueError: 
                pass
    return seq_ids


def create_initial_grid(num_seqs):
    num_seqs = int(num_seqs) if num_seqs else 10
    num_seqs = max(1, min(num_seqs, 10000))
    data = []
    for i in range(1, num_seqs + 1):
        row = {col: "" for col in COLUMNS}
        row["Sequence"] = f"Seq {i}"               
        row["Sequence Status"] = "Valid"
        row["Sequence Location"] = f"SeqID {i}"
        data.append(row)
    df = pd.DataFrame(data)
    return df, df, f"✓ Master Grid initialized with {num_seqs} sequence rows."


def add_single_sequence_row(master_df, state_df):
    df = master_df if (master_df is not None and not master_df.empty) else state_df
    if df is None or df.empty:
        df = pd.DataFrame(columns=COLUMNS)
    next_id = len(df) + 1
    new_row = {col: "" for col in COLUMNS}
    new_row["Sequence"] = f"Seq {next_id}"
    new_row["Sequence Status"] = "Valid"
    new_row["Sequence Location"] = f"SeqID {next_id}"
    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    return df, df, f"✓ Added sequence row Seq {next_id} (Total: {len(df)} rows)"


def import_existing_csv(file_obj):
    file_path = get_file_path(file_obj)
    if not file_path or not os.path.exists(file_path):
        return None, None, 10, "⚠️ No valid CSV file selected."
    try:
        df = pd.read_csv(file_path)
        # Ensure all standard 20 Clarivate columns exist
        for col in COLUMNS:
            if col not in df.columns:
                df[col] = ""
        df = df[COLUMNS]
        count = len(df)
        orig_name = get_original_filename(file_obj)
        return df, df, count, f"✓ Successfully imported {count} sequence rows from '{orig_name}'."
    except Exception as e:
        return None, None, 10, f"❌ Error importing CSV: {e}"


def apply_bulk_edits(master_df, state_df, target_seqs_str, seq_type, mol_type, 
                     ref_loc_type, ref_loc_num, phys_loc_type, phys_loc_val, 
                     org_list_text, org_type_list, disease_kws, include_disease_activity, tech_kws, ss_kws, gene_kws, 
                     protein_kws, uncat_kws, de_base, comments_base, keep_original_ss, term_map):
    df = master_df if (master_df is not None and not master_df.empty) else state_df
    if df is None or df.empty:
        return None, None, "⚠️ Master Grid is currently empty. Please go to '1. Setup & Thesaurus' and generate sequence rows first."

    target_seqs = parse_sequence_ids(target_seqs_str)
    
    # Parse multi-line Organism textarea (Name $ Comment)
    org_parts = []
    if org_list_text and str(org_list_text).strip():
        lines = str(org_list_text).strip().split('\\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            if '$' in line:
                name, comment = line.split('$', 1)
                clean_name = name.strip()
                if clean_name:
                    org_parts.append(clean_name + "$" + comment.strip())
            else:
                org_parts.append(f"{line.strip()}$")
                
    org_combined = ";".join(org_parts)
    if org_combined and not org_combined.endswith(';'):
        org_combined += ";"

    # Resolve keywords across all three columns
    dis_resolved = resolve_keywords(disease_kws, "Disease", term_map, include_disease_activity=include_disease_activity)
    
    # Technology Focus Keywords (Col 9): Tech Focus + General Descriptors
    combined_tech = (tech_kws or []) + (uncat_kws or [])
    tech_resolved = resolve_keywords(combined_tech, "Tech", term_map)
    
    # Sequence Specific Keywords (Col 8): SS + Gene + Protein
    gene_protein_names = set(str(k).strip().lstrip('@').split('/')[0].strip().lower() for k in ((gene_kws or []) + (protein_kws or [])))
    combined_ss = (ss_kws or []) + (gene_kws or []) + (protein_kws or [])
    ss_resolved = resolve_keywords(combined_ss, "SS", term_map, keep_original_gene_protein=keep_original_ss, gene_protein_terms=gene_protein_names)

    disease_kw_str = ";".join(dis_resolved)
    tech_kw_str = ";".join(tech_resolved)
    ss_kw_str = ";".join(ss_resolved)
    org_type_str = "; ".join(org_type_list) if org_type_list else ""

    loc_type_str = ""
    if ref_loc_type == "Claim" and str(ref_loc_num).strip(): 
        c_clean = re.sub(r'(?i)^claim\\s*', '', str(ref_loc_num).strip())
        loc_type_str = f"Claim {c_clean}"
    elif ref_loc_type == "Example" and str(ref_loc_num).strip(): 
        e_clean = re.sub(r'(?i)^(example|ex\\.?)\\s*', '', str(ref_loc_num).strip())
        loc_type_str = f"Example {e_clean}"
    elif ref_loc_type == "Disclosure Y": 
        loc_type_str = "Disclosure Y"
    elif ref_loc_type == "Features" and str(ref_loc_num).strip(): 
        f_clean = re.sub(r'(?i)^features?\\s*', '', str(ref_loc_num).strip())
        loc_type_str = f"Features {f_clean}"

    phys_loc_str = ""
    if phys_loc_type == "Page" and str(phys_loc_val).strip(): 
        p_clean = re.sub(r'(?i)^page\\s*', '', str(phys_loc_val).strip())
        phys_loc_str = f"Page {p_clean}"
    elif phys_loc_type == "Figure" and str(phys_loc_val).strip(): 
        fig_clean = re.sub(r'(?i)^(figure|fig\\.?)\\s*', '', str(phys_loc_val).strip())
        phys_loc_str = f"Figure {fig_clean}"
    elif phys_loc_type == "Column" and str(phys_loc_val).strip(): 
        col_clean = re.sub(r'(?i)^(column|col\\.?)\\s*', '', str(phys_loc_val).strip())
        phys_loc_str = f"Column {col_clean}"
    elif phys_loc_type == "SEQ ID NO": 
        phys_loc_str = str(phys_loc_val).strip() 

    updated_count = 0
    de_over_limit_count = 0
    df = df.copy()

    for index, row in df.iterrows():
        seq_num = index + 1
        if target_seqs != 'ALL' and seq_num not in target_seqs: 
            continue
            
        updated_count += 1
        if seq_type: df.at[index, 'Sequence Type'] = seq_type
        if mol_type: df.at[index, 'Molecule Type'] = mol_type
        if loc_type_str: df.at[index, 'Sequence Location Type'] = loc_type_str
        if org_combined: df.at[index, 'Organism Name'] = org_combined
        if org_type_str: df.at[index, 'Organism Type'] = org_type_str
        
        if phys_loc_str and phys_loc_type != "Skip":
            df.at[index, 'Sequence Location'] = phys_loc_str.replace('{x}', str(seq_num)).replace('{X}', str(seq_num)).replace('{id}', str(seq_num)).replace('{ID}', str(seq_num))
        
        if disease_kw_str: df.at[index, 'Disease Keywords'] = disease_kw_str
        if tech_kw_str: df.at[index, 'Technology Focus Keywords'] = tech_kw_str
        if ss_kw_str:
            existing_ss = str(row.get('Sequence Specific Keywords', ''))
            if existing_ss and existing_ss != 'nan':
                tokens = [t.strip() for t in existing_ss.split(';') if t.strip()]
                for kw in ss_resolved:
                    if kw not in tokens:
                        tokens.append(kw)
                df.at[index, 'Sequence Specific Keywords'] = ';'.join(tokens)
            else:
                df.at[index, 'Sequence Specific Keywords'] = ss_kw_str
                
        if de_base: 
            interpolated_de = de_base.replace('{x}', str(seq_num)).replace('{X}', str(seq_num)).replace('{id}', str(seq_num)).replace('{ID}', str(seq_num))
            df.at[index, 'DE Line'] = interpolated_de
            if len(interpolated_de) > 72:
                de_over_limit_count += 1
                
        if comments_base: 
            df.at[index, 'Comments'] = comments_base.replace('{x}', str(seq_num)).replace('{X}', str(seq_num)).replace('{id}', str(seq_num)).replace('{ID}', str(seq_num))

    msg = f"✓ Successfully indexed {updated_count} sequences with Clarivate rules."
    if de_over_limit_count > 0:
        msg += f"\\n⚠️ Notice: {de_over_limit_count} sequence(s) have DE lines longer than 72 characters. The Clarivate tool may flag these during patent import."

    return df, df, msg


def filter_grid(master_df, state_df, query, show_only_de_warnings=False):
    df = state_df if (state_df is not None and not state_df.empty) else master_df
    if df is None or df.empty:
        return df
    
    result = df
    if show_only_de_warnings and 'DE Line' in result.columns:
        result = result[result['DE Line'].astype(str).str.len() > 72]
        
    if query and query.strip():
        q = query.strip().lower()
        mask = result.astype(str).apply(lambda row: row.str.lower().str.contains(q, regex=False).any(), axis=1)
        result = result[mask]
        
    return result


def export_to_csv(master_df, state_df):
    df = master_df if (master_df is not None and not master_df.empty) else state_df
    if df is None or df.empty: 
        return gr.update(value=None, visible=False), "⚠️ Master grid is empty. Initialize sequences first."
    
    over_72_count = 0
    if 'DE Line' in df.columns:
        over_72_count = (df['DE Line'].astype(str).str.len() > 72).sum()

    temp_dir = tempfile.mkdtemp()
    output_path = os.path.join(temp_dir, "Geneseq_Final_Import.csv")
    df.to_csv(output_path, index=False)
    
    # Trigger Colab browser download if running inside Colab
    try:
        from google.colab import files as colab_files
        colab_files.download(output_path)
    except Exception:
        pass
        
    status = f"✓ Exported {len(df)} sequences to Geneseq_Final_Import.csv"
    if over_72_count > 0:
        status += f" (⚠️ {over_72_count} sequence(s) have DE Line > 72 chars)"
        
    return gr.update(value=output_path, visible=True), status


# ==============================================================================
# 5. HIGH-FIDELITY CUSTOM CSS (EXECUTIVE BIO-INFORMATICS THEME & COMPACT UPLOADERS)
# ==============================================================================
CUSTOM_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

body, .gradio-container {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    background-color: #f8fafc !important;
    color: #1e293b !important;
}

/* Executive Header Banner */
.app-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
    border: 1px solid #334155 !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) !important;
    border-radius: 12px !important;
    padding: 14px 20px !important;
    margin-bottom: 16px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}

/* Modern Tab Styling */
.tabs {
    border-bottom: 1.5px solid #e2e8f0 !important;
    background: transparent !important;
    gap: 8px !important;
}

button.tab-nav {
    font-weight: 600 !important;
    font-size: 13px !important;
    color: #64748b !important;
    border: none !important;
    padding: 9px 18px !important;
    border-radius: 6px !important;
    background: transparent !important;
    transition: all 0.15s ease !important;
}

button.tab-nav:hover {
    color: #0f172a !important;
    background: #f1f5f9 !important;
}

button.tab-nav.selected {
    background: #ffffff !important;
    color: #2563eb !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
    border: 1px solid #cbd5e1 !important;
}

/* Standard Typography Labels (Clean, flat, bold) */
.gradio-container label,
.gradio-container .block > label,
.gradio-container span.block-title,
.gradio-container .block-title,
.gradio-container .block-label {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 0 6px 0 !important;
    color: #0f172a !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    border-radius: 0 !important;
    display: block !important;
}

.gradio-container label > span,
.gradio-container .block-title > span,
.gradio-container span[data-testid="block-info"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    color: #0f172a !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    border-radius: 0 !important;
}

/* Standard Inputs & Textareas */
input[type="text"], 
input[type="number"], 
input[type="search"], 
textarea {
    background-color: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #0f172a !important;
    border-radius: 6px !important;
    font-size: 13px !important;
    padding: 7px 11px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
}

input[type="text"]:focus, 
input[type="number"]:focus, 
input[type="search"]:focus, 
textarea:focus {
    border-color: #2563eb !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
}

/* Primary Action Buttons */
button.primary-btn, 
button.btn-primary,
button[variant="primary"],
.gradio-container button.primary {
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%) !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    border-radius: 6px !important;
    border: none !important;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25) !important;
    transition: all 0.15s ease !important;
}

button.primary-btn:hover, 
button.btn-primary:hover,
button[variant="primary"]:hover,
.gradio-container button.primary:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.35) !important;
}

/* Secondary & Preset Buttons */
button.secondary-btn,
button.btn-secondary,
button[variant="secondary"],
.gradio-container button.secondary {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #334155 !important;
    font-weight: 500 !important;
    border-radius: 6px !important;
    transition: all 0.15s ease !important;
}

button.secondary-btn:hover,
button.btn-secondary:hover,
button[variant="secondary"]:hover,
.gradio-container button.secondary:hover {
    background: #f1f5f9 !important;
    border-color: #94a3b8 !important;
    color: #0f172a !important;
}

/* Standard Square Checkboxes */
input[type="checkbox"] {
    appearance: checkbox !important;
    -webkit-appearance: checkbox !important;
    width: 17px !important;
    height: 17px !important;
    min-width: 17px !important;
    min-height: 17px !important;
    border-radius: 3px !important;
    border: 1.5px solid #475569 !important;
    background-color: #ffffff !important;
    cursor: pointer !important;
    accent-color: #2563eb !important;
    margin: 0 6px 0 0 !important;
    vertical-align: middle !important;
}

input[type="checkbox"]:checked {
    background-color: #2563eb !important;
    accent-color: #2563eb !important;
}

label.checkbox-label, 
.gr-checkbox, 
label:has(input[type="checkbox"]) {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    cursor: pointer !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #1e293b !important;
    background: transparent !important;
    border: none !important;
    padding: 4px 6px !important;
    box-shadow: none !important;
}

/* Clean Dropdown Containers */
.gradio-dropdown {
    border-radius: 6px !important;
}

.gradio-dropdown .wrap {
    border: 1px solid #cbd5e1 !important;
    border-radius: 6px !important;
    background: #ffffff !important;
    padding: 3px 6px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
}

.gradio-dropdown .wrap:focus-within {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
}

.gradio-dropdown input {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 2px 4px !important;
    border-radius: 0 !important;
}

/* High-End Multi-select Chips (Soft Clarivate Blue) */
.gradio-dropdown .token,
.gradio-dropdown .wrap .token {
    background-color: #eff6ff !important;
    border: 1px solid #bfdbfe !important;
    color: #1e40af !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    border-radius: 4px !important;
    padding: 2px 8px !important;
}

/* Organism Type Checkbox Group */
.gr-checkbox-group {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 16px !important;
    align-items: center !important;
    padding-top: 4px !important;
}

.gr-checkbox-group label {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #334155 !important;
}

/* ========================================================================== */
/* COMPACT SLIM FILE & DOWNLOAD PREVIEWS (MAX 50px, HORIZONTAL ROW, TINY ICON) */
/* ========================================================================== */
.gradio-container .file-preview,
.gradio-container .upload-container,
.gradio-container .file-preview-holder,
.gradio-container [data-testid="file-upload"],
.gradio-container [data-testid="file-download"],
.gradio-container .file-wrapper,
.gradio-container .file-preview-wrap,
.gradio-container .download,
.gradio-container .file-component,
.gradio-container a[download],
.gradio-container div[data-testid="file-upload"] > div,
.gradio-container div[data-testid="file-download"] > div {
    max-height: 48px !important;
    min-height: 42px !important;
    height: 46px !important;
    padding: 4px 14px !important;
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 10px !important;
    overflow: hidden !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
}

.gradio-container .file-preview:hover,
.gradio-container .upload-container:hover,
.gradio-container [data-testid="file-download"]:hover {
    border-color: #2563eb !important;
    background: #f8fafc !important;
}

/* STRICT ICON CONSTRAINT: Tiny 20px document/upload icon across all elements */
.gradio-container .file-preview svg,
.gradio-container .upload-container svg,
.gradio-container svg.file-icon,
.gradio-container [data-testid="file-upload"] svg,
.gradio-container [data-testid="file-download"] svg,
.gradio-container .file-preview-holder svg,
.gradio-container .upload svg,
.gradio-container a[download] svg,
.gradio-container div[data-testid="file-upload"] svg,
.gradio-container div[data-testid="file-download"] svg {
    width: 20px !important;
    height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    min-width: 18px !important;
    min-height: 18px !important;
    margin: 0 !important;
    flex-shrink: 0 !important;
    color: #2563eb !important;
    stroke: #2563eb !important;
}

.gradio-container .file-preview .filename,
.gradio-container .file-name {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #0f172a !important;
    max-width: 260px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
}

.gradio-container .upload-container span,
.gradio-container [data-testid="file-upload"] span {
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #475569 !important;
}

/* Live 72-Char DE Gauge */
#live-de-gauge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 7px 12px;
    border-radius: 6px;
    margin-top: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.15s ease;
}
.gauge-ok {
    background-color: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
}
.gauge-over {
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    font-weight: bold;
}
"""

# Client-Side Zero-Latency JavaScript for 72-character tracking (Immediately Invoked)
CLIENT_JS = """
(() => {
    function attachCounter() {
        const deTextarea = document.querySelector("#de-input textarea") || document.querySelector("#de-input input");
        const gaugeEl = document.querySelector("#live-de-gauge");
        
        if (deTextarea && gaugeEl) {
            function updateGauge() {
                const len = (deTextarea.value || "").length;
                if (len === 0) {
                    gaugeEl.className = "gauge-ok";
                    gaugeEl.innerHTML = "<span>✓ Valid DE Line length: </span><span>0 / 72 chars (72 left)</span>";
                } else if (len <= 72) {
                    gaugeEl.className = "gauge-ok";
                    gaugeEl.innerHTML = "<span>✓ Valid DE Line length: </span><span>" + len + " / 72 chars (" + (72 - len) + " left)</span>";
                } else {
                    const over = len - 72;
                    gaugeEl.className = "gauge-over";
                    gaugeEl.innerHTML = "<span>⚠️ EXCEEDS CLARIVATE LIMIT: </span><span>" + len + " / 72 chars (+" + over + " over!)</span>";
                }
            }
            
            if (!deTextarea.dataset.hasCounter) {
                deTextarea.dataset.hasCounter = "true";
                deTextarea.addEventListener("input", updateGauge);
                deTextarea.addEventListener("keyup", updateGauge);
                deTextarea.addEventListener("change", updateGauge);
            }
            // Always sync current value (handles programmatic clear)
            updateGauge();
        }
    }
    setInterval(attachCounter, 300);
})()
"""

# ==============================================================================
# 6. GRADIO INTERFACE LAYOUT (EXECUTIVE THEME)
# ==============================================================================
app_theme = gr.themes.Default(primary_hue="blue", neutral_hue="slate")

with gr.Blocks(title="Clarivate Geneseq Auto-Indexer") as app:
    
    # Injected Direct CSS & Navigation Banner
    gr.HTML(f"""
    <style>
    {CUSTOM_CSS}
    </style>
    <div class="app-header">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
                🧬 CLARIVATE GENESEQ
            </div>
            <div>
                <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #ffffff;">Auto-Indexer & Curation Workspace</h2>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">Patent Sequence Indexing &bull; Production Standard Edition</p>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-family: monospace; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 5px 10px; border-radius: 6px; font-weight: 600;">
                ● Live 72-Char DE Validation
            </span>
            <span style="font-size: 11px; font-family: monospace; background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); padding: 5px 10px; border-radius: 6px; font-weight: 600;">
                ● Preferred Term + USE ALSO
            </span>
        </div>
    </div>
    """)
    
    # State Stores
    grid_state = gr.State(pd.DataFrame(columns=COLUMNS))
    term_map_state = gr.State(INITIAL_TERM_MAP)

    with gr.Tabs():
        
        # ----------------------------------------------------------------------
        # TAB 1: SETUP & THESAURUS
        # ----------------------------------------------------------------------
        with gr.Tab("1. Setup & Thesaurus"):
            with gr.Row():
                # Panel 1: Thesaurus Dictionary
                with gr.Column(scale=1):
                    gr.Markdown("### Controlled Thesaurus Matrix")
                    gr.Markdown("Synchronize official Clarivate thesaurus sheets ('.xlsx', '.xlsm', '.xls', or '.csv') for Disease, Technology Focus, and Sequence Specific terms.")
                    
                    with gr.Row():
                        thesaurus_file = gr.UploadButton("📂 Choose Thesaurus File", file_types=[".xlsx", ".xls", ".xlsm", ".csv"], variant="secondary", scale=3)
                        load_thesaurus_btn = gr.Button("🔄 Sync / Load Terms", variant="primary", scale=2)
                    
                    thesaurus_status = gr.Markdown("● *Clarivate Core Seed Dictionary Active (95 terms)*")
                
                # Panel 2: Initialize Grid or Import CSV
                with gr.Column(scale=1):
                    gr.Markdown("### Initialize Master Sequence Grid")
                    gr.Markdown("Generate a blank 20-column template, or import an existing Clarivate CSV export file.")
                    
                    with gr.Row():
                        num_seqs_input = gr.Number(label="Sequence Count", value=10, precision=0, scale=3)
                        init_btn = gr.Button("Generate Blank Grid", variant="primary", scale=2)
                    
                    with gr.Row():
                        preset_10 = gr.Button("10", size="sm")
                        preset_25 = gr.Button("25", size="sm")
                        preset_50 = gr.Button("50", size="sm")
                        preset_100 = gr.Button("100", size="sm")
                        preset_250 = gr.Button("250", size="sm")

                    gr.HTML('<div style="border-top: 1px solid #e2e8f0; margin: 12px 0 8px 0; padding-top: 8px;"><span style="font-size: 12px; font-weight: 600; color: #475569;">Or Import Existing Clarivate CSV:</span></div>')
                    with gr.Row():
                        csv_import_file = gr.UploadButton("📂 Choose CSV File", file_types=[".csv"], variant="secondary", scale=3)
                        import_csv_btn = gr.Button("📥 Process CSV Import", variant="primary", scale=2)
                    init_status = gr.Markdown("")

        # ----------------------------------------------------------------------
        # TAB 2: BULK INDEXING EDITOR
        # ----------------------------------------------------------------------
        with gr.Tab("2. Bulk Indexing Editor"):
            with gr.Row():
                with gr.Column(scale=1):
                    target_range = gr.Textbox(
                        label="Apply to Sequence IDs", 
                        value="all", 
                        placeholder="all or comma-separated ranges e.g. 1-10, 15"
                    )
                    with gr.Row():
                        preset_rng_all = gr.Button("all", size="sm")
                        preset_rng_1_5 = gr.Button("1-5", size="sm")
                        preset_rng_6_10 = gr.Button("6-10", size="sm")
                        clear_rng_btn = gr.Button("Clear Range", size="sm")
                with gr.Column(scale=1):
                    with gr.Row():
                        seq_type_dd = gr.Dropdown(choices=["P1", "N(DNA)", "N(RNA)"], label="Sequence Type")
                        mol_type_dd = gr.Dropdown(choices=["protein", "peptide", "DNA", "RNA"], label="Molecule Type")
            
            with gr.Row():
                with gr.Column(scale=1):
                    ref_loc_type = gr.Radio(choices=["Skip", "Claim", "Example", "Disclosure Y", "Features"], label="Referred To Location", value="Skip")
                    ref_loc_num = gr.Textbox(label="Location Number", placeholder="e.g. 1 or 1-5")
                with gr.Column(scale=1):
                    phys_loc_type = gr.Radio(choices=["Skip", "Page", "Figure", "Column", "SEQ ID NO"], label="Physical Location", value="Skip")
                    phys_loc_val = gr.Textbox(label="Location Value", placeholder="e.g. SeqID {x}")

            gr.HTML("""
            <div style="border-top: 1px solid #e2e8f0; margin: 12px 0 8px 0; padding-top: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: #0f172a;">NCBI Organism Classification</span>
            </div>
            """)
            
            with gr.Row():
                org_list_text = gr.TextArea(
                    label="Organisms List (One organism per line: Name $ Comment)", 
                    lines=4, 
                    placeholder="Homo sapiens $ strain K-12\\nMus musculus $\\nEscherichia coli $ mutant"
                )
                org_type_cb = gr.CheckboxGroup(choices=["Synthetic", "Chimeric", "Unidentified"], label="Organism Type")

            gr.HTML("""
            <div style="border-top: 1px solid #e2e8f0; margin: 12px 0 8px 0; padding-top: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: #0f172a;">Controlled Thesaurus Keyword Categorization (Columns 7, 8, 9)</span>
            </div>
            """)
            
            # Disease Keywords (Col 7)
            with gr.Row():
                disease_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Disease" in v['categories']], multiselect=True, allow_custom_value=True, label="Disease Keywords (Col 7)", scale=3)
                include_disease_act_cb = gr.Checkbox(value=True, label="Include /activity qualifier (e.g. cancer /cytostatic)", scale=2)

            # Technology Focus & Descriptors (Col 9)
            with gr.Row():
                tech_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Tech" in v['categories']], multiselect=True, allow_custom_value=True, label="Technology Focus Terms (Col 9)")
                uncat_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Uncategorised" in v['categories']], multiselect=True, allow_custom_value=True, label="General Descriptors (Linked to Col 9)")

            # Sequence Specific Keywords (Col 8)
            with gr.Row():
                ss_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "SS" in v['categories']], multiselect=True, allow_custom_value=True, label="Sequence Specific Terms (Col 8)")
                gene_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Gene" in v['categories']], multiselect=True, allow_custom_value=True, label="Gene Symbols (Col 8)")
                protein_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Protein" in v['categories']], multiselect=True, allow_custom_value=True, label="Protein Targets (Col 8)")

            with gr.Row():
                keep_original_ss = gr.Checkbox(
                    value=True, 
                    label="Retain original term for Gene and Protein targets alongside preferred term in Col 8 (e.g. FASL -> FASLG; FASL)"
                )
            
            # --- 72-CHARACTER DE LINE WITH CLIENT-SIDE ZERO-LAG COUNTER ---
            gr.HTML("""
            <div style="border-top: 1px solid #e2e8f0; margin: 12px 0 8px 0; padding-top: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: #0f172a;">Title / DE Line (Clarivate &le; 72-Character Standard)</span>
            </div>
            """)
            de_base_txt = gr.Textbox(
                elem_id="de-input",
                label="DE Line Base Template (Use '{x}' for sequential ID)", 
                placeholder="e.g. Homo sapiens FASL gene, SEQ ID NO: {x}"
            )
            # Live gauge updating via client-side DOM observer without network roundtrips
            gr.HTML('<div id="live-de-gauge" class="gauge-ok"><span>✓ Valid DE Line length: </span><span>0 / 72 chars (72 left)</span></div>')

            comments_txt = gr.TextArea(
                label="Comments Template (Use '{x}' for sequence number)", 
                lines=2, 
                placeholder="e.g. The present sequence is SEQ ID NO: {x} (see {seqid:{x}})..."
            )
            
            with gr.Row():
                apply_btn = gr.Button("⚙️ Apply Indexing Rules to Grid", variant="primary")
                clear_editor_btn = gr.Button("🔄 Clear Editor Form", variant="secondary")

            editor_feedback = gr.Markdown("")

        # ----------------------------------------------------------------------
        # TAB 3: MASTER SEQUENCE GRID & EXPORT
        # ----------------------------------------------------------------------
        with gr.Tab("3. Master Sequence Grid"):
            with gr.Row():
                grid_search = gr.Textbox(label="Filter Rows by Text / SEQ ID", placeholder="Type to search rows...", scale=3)
                show_de_warnings_cb = gr.Checkbox(label="Show Only DE > 72 Warnings", value=False, scale=1)
                refresh_grid_btn = gr.Button("Search / Apply Filter", scale=1)
                clear_filter_btn = gr.Button("Clear Filter", scale=1)

            # Master table without auto-sync lag
            master_grid = gr.Dataframe(
                headers=COLUMNS, 
                interactive=True, 
                wrap=False
            )
            
            with gr.Row():
                add_row_btn = gr.Button("➕ Add Sequence Row", variant="secondary", scale=2)
                export_btn = gr.Button("💾 Export to Clarivate CSV (Auto-Download)", variant="primary", scale=3)
                clear_grid_btn = gr.Button("🗑️ Clear Master Grid", variant="stop", scale=2)
            
            grid_status_msg = gr.Markdown("")
            download_file = gr.File(label="📥 Download Generated Clarivate CSV", interactive=False, visible=False, height=46)

    # ==============================================================================
    # 7. EVENT BINDINGS (OPTIMIZED PIPELINE)
    # ==============================================================================
    # Thesaurus Upload & Process (triggers on file upload completion and button click)
    for trigger in [thesaurus_file.upload, load_thesaurus_btn.click]:
        trigger(
            fn=process_thesaurus,
            inputs=[thesaurus_file, term_map_state],
            outputs=[disease_dd, tech_dd, ss_dd, gene_dd, protein_dd, uncat_dd, term_map_state, thesaurus_status]
        )

    # Grid Initializer (Direct synchronous populate)
    init_btn.click(
        fn=create_initial_grid, 
        inputs=[num_seqs_input], 
        outputs=[master_grid, grid_state, init_status]
    )

    # CSV Importer (triggers on file upload completion and button click)
    for csv_trigger in [csv_import_file.upload, import_csv_btn.click]:
        csv_trigger(
            fn=import_existing_csv,
            inputs=[csv_import_file],
            outputs=[master_grid, grid_state, num_seqs_input, init_status]
        )

    # Presets
    def make_preset_action(val):
        def _preset():
            return (val, *create_initial_grid(val))
        return _preset

    for p_btn, p_val in [(preset_10, 10), (preset_25, 25), (preset_50, 50), (preset_100, 100), (preset_250, 250)]:
        p_btn.click(
            fn=make_preset_action(p_val),
            inputs=[],
            outputs=[num_seqs_input, master_grid, grid_state, init_status]
        )

    # Target Range Presets
    preset_rng_all.click(fn=lambda: "all", inputs=[], outputs=[target_range])
    preset_rng_1_5.click(fn=lambda: "1-5", inputs=[], outputs=[target_range])
    preset_rng_6_10.click(fn=lambda: "6-10", inputs=[], outputs=[target_range])
    clear_rng_btn.click(fn=lambda: "", inputs=[], outputs=[target_range])

    # Apply Bulk Edits (Direct update to master_grid & state)
    apply_btn.click(
        fn=apply_bulk_edits,
        inputs=[
            master_grid, grid_state, target_range, seq_type_dd, mol_type_dd, 
            ref_loc_type, ref_loc_num, phys_loc_type, phys_loc_val, 
            org_list_text, org_type_cb, disease_dd, include_disease_act_cb, tech_dd, ss_dd, gene_dd, 
            protein_dd, uncat_dd, de_base_txt, comments_txt, keep_original_ss, term_map_state
        ],
        outputs=[master_grid, grid_state, editor_feedback]
    )

    # Search / Filter
    refresh_grid_btn.click(
        fn=filter_grid,
        inputs=[master_grid, grid_state, grid_search, show_de_warnings_cb],
        outputs=[master_grid]
    )

    clear_filter_btn.click(
        fn=lambda m, s: ("", False, s if (s is not None and not s.empty) else m),
        inputs=[master_grid, grid_state],
        outputs=[grid_search, show_de_warnings_cb, master_grid]
    )

    # Add Single Row
    add_row_btn.click(
        fn=add_single_sequence_row,
        inputs=[master_grid, grid_state],
        outputs=[master_grid, grid_state, grid_status_msg]
    )

    # Clear Editor Form
    def clear_editor_form():
        return (
            "all", None, None, "Skip", "", "Skip", "", "", [], 
            True, [], [], True, [], [], [], [], "", "", 
            "✓ Bulk editor form cleared and reset to defaults."
        )

    clear_editor_btn.click(
        fn=clear_editor_form,
        inputs=[],
        outputs=[
            target_range, seq_type_dd, mol_type_dd, ref_loc_type, ref_loc_num, 
            phys_loc_type, phys_loc_val, org_list_text, org_type_cb, 
            include_disease_act_cb, disease_dd, tech_dd, keep_original_ss, 
            ss_dd, gene_dd, protein_dd, uncat_dd, 
            de_base_txt, comments_txt, editor_feedback
        ]
    )

    # Clear Master Grid
    def clear_master_grid():
        empty_df = pd.DataFrame(columns=COLUMNS)
        return empty_df, empty_df, gr.update(value=None, visible=False), "✓ Master Grid cleared. Generate a new grid or import a CSV to begin."

    clear_grid_btn.click(
        fn=clear_master_grid,
        inputs=[],
        outputs=[grid_state, master_grid, download_file, grid_status_msg]
    )

    # Export to CSV
    export_btn.click(
        fn=export_to_csv, 
        inputs=[master_grid, grid_state], 
        outputs=[download_file, grid_status_msg]
    )

# Launch in Google Colab (inline notebook + public link)
if __name__ == "__main__":
    launch_args = {
        "share": True, 
        "inline": True, 
        "theme": app_theme, 
        "css": CUSTOM_CSS, 
        "js": CLIENT_JS
    }
    try:
        app.launch(**launch_args)
    except TypeError:
        try:
            app.launch(share=True, inline=True, theme=app_theme, js=CLIENT_JS)
        except Exception:
            app.launch(share=True, inline=True)
`;
